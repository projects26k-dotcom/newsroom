import fs from "fs";
import path from "path";
import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";
import sanitizeHtml from "sanitize-html";
import { resolveGoogleNewsUrl } from "./resolve";
import { cleanDomain, getPublisherDomain } from "./utils";

export interface ExtractedArticle {
  title: string;
  byline?: string | null;
  publishDate?: string | null;
  leadImage?: string | null;
  contentHtml?: string | null;
  excerpt?: string | null;
  publisherUrl: string;
  domain: string;
  sourceName: string;
  charCount: number;
  isFallback: boolean;
  fallbackReason?: string | null;
  googleUrl: string;
}

export function encodeArticleId(url: string): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(url, "utf-8").toString("base64url");
  }
  return btoa(encodeURIComponent(url))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function decodeArticleId(id: string): string {
  try {
    if (typeof Buffer !== "undefined") {
      return Buffer.from(id, "base64url").toString("utf-8");
    }
    const b64 = id.replace(/-/g, "+").replace(/_/g, "/");
    return decodeURIComponent(atob(b64));
  } catch {
    return "";
  }
}

const CACHE_DIR = path.join(process.cwd(), ".cache");
const CACHE_FILE = path.join(CACHE_DIR, "articles.json");
const CACHE_TTL = 3600 * 1000; // 1 hour

interface CacheEntry {
  article: ExtractedArticle;
  timestamp: number;
}

const memoryCache = new Map<string, CacheEntry>();

function loadCache(): void {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const data = JSON.parse(fs.readFileSync(CACHE_FILE, "utf-8"));
      for (const [key, val] of Object.entries(data)) {
        memoryCache.set(key, val as CacheEntry);
      }
    }
  } catch {
    // Ignore read errors
  }
}

let saveTimeout: NodeJS.Timeout | null = null;
function scheduleSaveCache(): void {
  if (saveTimeout) return;
  saveTimeout = setTimeout(() => {
    saveTimeout = null;
    try {
      if (!fs.existsSync(CACHE_DIR)) {
        fs.mkdirSync(CACHE_DIR, { recursive: true });
      }
      const obj: Record<string, CacheEntry> = {};
      const now = Date.now();
      for (const [key, val] of memoryCache.entries()) {
        if (now - val.timestamp < CACHE_TTL) {
          obj[key] = val;
        }
      }
      fs.writeFileSync(CACHE_FILE, JSON.stringify(obj, null, 2), "utf-8");
    } catch {
      // Ignore write errors
    }
  }, 1000);
}

loadCache();

/**
 * Extract lead image from HTML metadata or content
 */
function extractLeadImage(dom: JSDOM, publisherUrl: string): string | null {
  const doc = dom.window.document;
  const candidates = [
    doc.querySelector('meta[property="og:image"]')?.getAttribute("content"),
    doc.querySelector('meta[name="og:image"]')?.getAttribute("content"),
    doc.querySelector('meta[property="og:image:secure_url"]')?.getAttribute("content"),
    doc.querySelector('meta[name="twitter:image"]')?.getAttribute("content"),
    doc.querySelector('meta[property="twitter:image"]')?.getAttribute("content"),
    doc.querySelector('link[rel="image_src"]')?.getAttribute("href"),
  ];

  for (const raw of candidates) {
    if (!raw || typeof raw !== "string") continue;
    const trimmed = raw.trim();
    if (!trimmed) continue;
    try {
      const absolute = new URL(trimmed, publisherUrl).href;
      if (absolute.startsWith("http://") || absolute.startsWith("https://")) {
        const lower = absolute.toLowerCase();
        if (!lower.includes("logo") && !lower.includes("favicon") && !lower.endsWith(".svg")) {
          return absolute;
        }
      }
    } catch {
      continue;
    }
  }
  return null;
}

/**
 * Extract publish date from metadata or document
 */
function extractPublishDate(dom: JSDOM): string | null {
  const doc = dom.window.document;
  const candidates = [
    doc.querySelector('meta[property="article:published_time"]')?.getAttribute("content"),
    doc.querySelector('meta[name="publish-date"]')?.getAttribute("content"),
    doc.querySelector('meta[name="pubdate"]')?.getAttribute("content"),
    doc.querySelector('meta[name="date"]')?.getAttribute("content"),
    doc.querySelector('time[datetime]')?.getAttribute("datetime"),
  ];

  for (const raw of candidates) {
    if (raw && typeof raw === "string") {
      const d = new Date(raw.trim());
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString("en-IN", {
          day: "numeric",
          month: "long",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
      }
    }
  }
  return null;
}

/**
 * Sanitize Readability HTML content
 */
function sanitizeArticleHtml(rawHtml: string, publisherUrl: string): string {
  return sanitizeHtml(rawHtml, {
    allowedTags: [
      "p",
      "h2",
      "h3",
      "ul",
      "ol",
      "li",
      "blockquote",
      "strong",
      "em",
      "a",
      "img",
      "figure",
      "figcaption",
    ],
    allowedAttributes: {
      a: ["href", "target", "rel"],
      img: ["src", "alt", "width", "height", "loading", "referrerpolicy"],
    },
    transformTags: {
      a: (tagName, attribs) => {
        let href = attribs.href || "";
        if (href && !href.startsWith("http://") && !href.startsWith("https://")) {
          try {
            href = new URL(href, publisherUrl).href;
          } catch {}
        }
        return {
          tagName: "a",
          attribs: {
            ...attribs,
            href,
            target: "_blank",
            rel: "noopener noreferrer",
          },
        };
      },
      img: (tagName, attribs) => {
        let src = attribs.src || "";
        if (src && !src.startsWith("http://") && !src.startsWith("https://")) {
          try {
            src = new URL(src, publisherUrl).href;
          } catch {}
        }
        return {
          tagName: "img",
          attribs: {
            ...attribs,
            src,
            loading: "lazy",
            referrerpolicy: "no-referrer",
          },
        };
      },
    },
  });
}

/**
 * Fetch and extract article in Reader Mode with 1-hour cache and resilient fallback
 */
export async function getArticleByUrl(googleUrl: string): Promise<ExtractedArticle> {
  const now = Date.now();
  const cached = memoryCache.get(googleUrl);
  if (cached && now - cached.timestamp < CACHE_TTL) {
    return cached.article;
  }

  let publisherUrl = googleUrl;
  let domain = "google.com";

  // Step 1: Resolve Google News URL
  if (googleUrl.includes("news.google.com")) {
    const resolved = await resolveGoogleNewsUrl(googleUrl);
    if (resolved) {
      publisherUrl = resolved;
    }
  }

  try {
    domain = cleanDomain(new URL(publisherUrl).hostname);
  } catch {
    domain = "news.google.com";
  }

  const sourceName = domain.replace(/^www\./i, "").split(".")[0].toUpperCase();

  // If resolution failed and stays on Google
  if (publisherUrl.includes("news.google.com")) {
    console.log(`Article failed ${domain}: Resolution remained on Google News`);
    const fallbackArticle: ExtractedArticle = {
      title: "News Dispatch",
      publisherUrl,
      domain,
      sourceName,
      charCount: 0,
      isFallback: true,
      fallbackReason: "Could not unwrap direct publisher destination link",
      googleUrl,
    };
    memoryCache.set(googleUrl, { article: fallbackArticle, timestamp: now });
    scheduleSaveCache();
    return fallbackArticle;
  }

  // Step 2: Fetch publisher HTML server-side with 6-second timeout
  let html = "";
  try {
    const res = await fetch(publisherUrl, {
      signal: AbortSignal.timeout(6000),
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
        "Accept-Language": "en-IN,en;q=0.9,hi;q=0.8",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });

    if (!res.ok) {
      console.log(`Article failed ${domain}: HTTP ${res.status}`);
      const fallbackArticle: ExtractedArticle = {
        title: "News Dispatch",
        publisherUrl,
        domain,
        sourceName,
        charCount: 0,
        isFallback: true,
        fallbackReason: `Publisher returned HTTP ${res.status}`,
        googleUrl,
      };
      memoryCache.set(googleUrl, { article: fallbackArticle, timestamp: now });
      scheduleSaveCache();
      return fallbackArticle;
    }

    html = await res.text();
  } catch (err: any) {
    console.log(`Article failed ${domain}: ${err.message || "Fetch timeout / blocked"}`);
    const fallbackArticle: ExtractedArticle = {
      title: "News Dispatch",
      publisherUrl,
      domain,
      sourceName,
      charCount: 0,
      isFallback: true,
      fallbackReason: err.message || "Connection timed out or blocked by publisher",
      googleUrl,
    };
    memoryCache.set(googleUrl, { article: fallbackArticle, timestamp: now });
    scheduleSaveCache();
    return fallbackArticle;
  }

  // Step 3: Parse with JSDOM and Readability
  try {
    const dom = new JSDOM(html, { url: publisherUrl });
    const leadImage = extractLeadImage(dom, publisherUrl);
    const publishDate = extractPublishDate(dom);

    const ogTitle =
      dom.window.document.querySelector('meta[property="og:title"]')?.getAttribute("content") ||
      dom.window.document.querySelector("title")?.textContent ||
      "";

    const ogDescription =
      dom.window.document.querySelector('meta[property="og:description"]')?.getAttribute("content") ||
      dom.window.document.querySelector('meta[name="description"]')?.getAttribute("content") ||
      "";

    const reader = new Readability(dom.window.document);
    const parsed = reader.parse();

    const title = (parsed?.title || ogTitle || "News Dispatch").trim();
    const byline = parsed?.byline || null;
    const excerpt = (parsed?.excerpt || ogDescription || "").trim();
    const textContent = parsed?.textContent?.trim() || "";
    const charCount = textContent.length;

    // Check if extraction succeeded and has at least 300 characters
    if (!parsed || !parsed.content || charCount < 300) {
      console.log(
        `Article failed ${domain}: Content too short or extraction empty (${charCount} chars)`
      );
      const fallbackArticle: ExtractedArticle = {
        title,
        byline,
        publishDate,
        leadImage,
        excerpt,
        publisherUrl,
        domain,
        sourceName,
        charCount,
        isFallback: true,
        fallbackReason: "Full text isn't available here",
        googleUrl,
      };
      memoryCache.set(googleUrl, { article: fallbackArticle, timestamp: now });
      scheduleSaveCache();
      return fallbackArticle;
    }

    // Sanitize the HTML
    const sanitizedHtml = sanitizeArticleHtml(parsed.content, publisherUrl);

    console.log(`Article OK ${domain} ${charCount} chars`);

    const articleResult: ExtractedArticle = {
      title,
      byline,
      publishDate,
      leadImage,
      contentHtml: sanitizedHtml,
      excerpt,
      publisherUrl,
      domain,
      sourceName,
      charCount,
      isFallback: false,
      googleUrl,
    };

    memoryCache.set(googleUrl, { article: articleResult, timestamp: now });
    scheduleSaveCache();
    return articleResult;
  } catch (err: any) {
    console.log(`Article failed ${domain}: Readability parser error (${err.message})`);
    const fallbackArticle: ExtractedArticle = {
      title: "News Dispatch",
      publisherUrl,
      domain,
      sourceName,
      charCount: 0,
      isFallback: true,
      fallbackReason: "Reader mode extraction could not parse document structure",
      googleUrl,
    };
    memoryCache.set(googleUrl, { article: fallbackArticle, timestamp: now });
    scheduleSaveCache();
    return fallbackArticle;
  }
}
