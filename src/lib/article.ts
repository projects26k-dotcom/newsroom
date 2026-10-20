import fs from "fs";
import path from "path";
import { parseHTML } from "linkedom";
import { Readability } from "@mozilla/readability";
import sanitizeHtml from "sanitize-html";
import { resolveGoogleNewsUrl } from "./resolve";
import { cleanDomain } from "./utils";
export { encodeArticleId, decodeArticleId } from "./encoder";

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
  youtubeVideoId?: string | null;
  directVideoUrl?: string | null;
}

const CACHE_DIR = path.join("/tmp", "newsroom-cache");
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
 * Extract lead image from HTML document metadata
 */
function extractLeadImage(doc: any, publisherUrl: string): string | null {
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
 * Extract publish date from document metadata
 */
function extractPublishDate(doc: any): string | null {
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
 * Extract YouTube video ID from various URL patterns
 */
export function extractYouTubeId(url: string | null | undefined): string | null {
  if (!url || typeof url !== "string") return null;
  const match = url.match(
    /(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/
  );
  return match ? match[1] : null;
}

/**
 * Extract YouTube or direct video embed info from document
 */
function extractVideoInfo(doc: any): { youtubeVideoId: string | null; directVideoUrl: string | null } {
  try {
    // 1. Check iframes in document
    const iframes = doc.querySelectorAll("iframe");
    for (const iframe of iframes) {
      const src = iframe.getAttribute("src") || iframe.getAttribute("data-src") || "";
      const ytId = extractYouTubeId(src);
      if (ytId) {
        return { youtubeVideoId: ytId, directVideoUrl: null };
      }
    }

    // 2. Check og:video metadata
    const ogVideoCandidates = [
      doc.querySelector('meta[property="og:video"]')?.getAttribute("content"),
      doc.querySelector('meta[property="og:video:url"]')?.getAttribute("content"),
      doc.querySelector('meta[property="og:video:secure_url"]')?.getAttribute("content"),
      doc.querySelector('meta[name="twitter:player"]')?.getAttribute("content"),
    ];

    for (const candidate of ogVideoCandidates) {
      if (!candidate || typeof candidate !== "string") continue;
      const trimmed = candidate.trim();
      const ytId = extractYouTubeId(trimmed);
      if (ytId) {
        return { youtubeVideoId: ytId, directVideoUrl: null };
      }
      if (
        trimmed.startsWith("https://") &&
        (trimmed.toLowerCase().includes(".mp4") || trimmed.toLowerCase().includes("video/mp4"))
      ) {
        return { youtubeVideoId: null, directVideoUrl: trimmed };
      }
    }

    // 3. Check anchor links to youtube.com/watch or youtu.be
    const links = doc.querySelectorAll("a[href]");
    for (const link of links) {
      const href = link.getAttribute("href") || "";
      if (href.includes("youtube.com/watch") || href.includes("youtu.be/")) {
        const ytId = extractYouTubeId(href);
        if (ytId) {
          return { youtubeVideoId: ytId, directVideoUrl: null };
        }
      }
    }
  } catch {
    // Graceful fallback
  }

  return { youtubeVideoId: null, directVideoUrl: null };
}

/**
 * Sanitize Readability HTML content - allows ONLY youtube-nocookie.com iframes
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
      "iframe",
    ],
    allowedAttributes: {
      a: ["href", "target", "rel"],
      img: ["src", "alt", "width", "height", "loading", "referrerpolicy"],
      iframe: ["src", "width", "height", "frameborder", "allow", "allowfullscreen", "title"],
    },
    allowedIframeHostnames: ["www.youtube-nocookie.com", "youtube-nocookie.com"],
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
      iframe: (tagName, attribs) => {
        const src = attribs.src || "";
        const ytId = extractYouTubeId(src);
        if (ytId) {
          return {
            tagName: "iframe",
            attribs: {
              ...attribs,
              src: `https://www.youtube-nocookie.com/embed/${ytId}`,
              frameborder: "0",
              allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture",
              allowfullscreen: "true",
              class: "aspect-video w-full rounded-xl my-4",
            },
          };
        }
        if (src.startsWith("https://www.youtube-nocookie.com/embed/")) {
          return {
            tagName: "iframe",
            attribs: {
              ...attribs,
              src,
              class: "aspect-video w-full rounded-xl my-4",
            },
          };
        }
        return {
          tagName: "span",
          attribs: { class: "hidden" },
        };
      },
    },
  });
}

/**
 * Fetch and extract article in Reader Mode using linkedom and Readability
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
      title: "News Story",
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
        title: "News Story",
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
      title: "News Story",
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

  // Step 3: Parse with linkedom and Readability
  try {
    const { document } = parseHTML(html);
    const leadImage = extractLeadImage(document, publisherUrl);
    const publishDate = extractPublishDate(document);

    const ogTitle =
      document.querySelector('meta[property="og:title"]')?.getAttribute("content") ||
      document.querySelector("title")?.textContent ||
      "";

    const ogDescription =
      document.querySelector('meta[property="og:description"]')?.getAttribute("content") ||
      document.querySelector('meta[name="description"]')?.getAttribute("content") ||
      "";

    const reader = new Readability(document);
    const parsed = reader.parse();

    const title = (parsed?.title || ogTitle || "News Story").trim();
    const byline = parsed?.byline || null;
    const excerpt = (parsed?.excerpt || ogDescription || "").trim();
    const textContent = parsed?.textContent?.trim() || "";
    const charCount = textContent.length;

    const videoInfo = extractVideoInfo(document);

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
        youtubeVideoId: videoInfo.youtubeVideoId,
        directVideoUrl: videoInfo.directVideoUrl,
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
      youtubeVideoId: videoInfo.youtubeVideoId,
      directVideoUrl: videoInfo.directVideoUrl,
    };

    memoryCache.set(googleUrl, { article: articleResult, timestamp: now });
    scheduleSaveCache();
    return articleResult;
  } catch (err: any) {
    console.log(`Article failed ${domain}: Readability parser error (${err.message})`);
    const fallbackArticle: ExtractedArticle = {
      title: "News Story",
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
