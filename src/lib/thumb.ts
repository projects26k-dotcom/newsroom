import fs from "fs";
import path from "path";
import * as cheerio from "cheerio";
import { resolveGoogleNewsUrl } from "./resolve";

interface CacheEntry {
  image: string | null;
  publisherUrl: string | null;
  timestamp: number;
}

const CACHE_DIR = path.join("/tmp", "newsroom-cache");
const CACHE_FILE = path.join(CACHE_DIR, "thumbs.json");
const SUCCESS_TTL = 24 * 60 * 60 * 1000; // 24 hours
const FAILURE_TTL = 1 * 60 * 60 * 1000; // 1 hour

// In-memory cache
const memoryCache = new Map<string, CacheEntry>();
// In-flight deduplication promises
const inFlightPromises = new Map<
  string,
  Promise<{ image: string | null; publisherUrl: string | null; reason: string }>
>();

// Load persistent disk cache
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

// Save persistent disk cache
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
        const ttl = val.image ? SUCCESS_TTL : FAILURE_TTL;
        if (now - val.timestamp < ttl) {
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

// Concurrency Semaphore (max 4 parallel requests)
class Semaphore {
  private current = 0;
  private queue: (() => void)[] = [];

  constructor(private max: number) {}

  async acquire(): Promise<void> {
    if (this.current < this.max) {
      this.current++;
      return;
    }
    return new Promise((resolve) => this.queue.push(resolve));
  }

  release(): void {
    this.current--;
    if (this.queue.length > 0) {
      this.current++;
      const next = this.queue.shift();
      if (next) next();
    }
  }
}

const concurrencyLimiter = new Semaphore(4);

/**
 * Fetch publisher URL HTML reading up to first 300 KB
 */
async function fetchFirst300KB(url: string): Promise<string> {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(4000),
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
      "Accept-Language": "en-IN,en;q=0.9,hi;q=0.8",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
  });

  if (!res.ok || !res.body) return "";

  const reader = res.body.getReader();
  let receivedBytes = 0;
  const chunks: Uint8Array[] = [];
  const maxBytes = 300 * 1024; // 300 KB

  while (receivedBytes < maxBytes) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      chunks.push(value);
      receivedBytes += value.length;
    }
  }

  try {
    await reader.cancel();
  } catch {}

  const merged = new Uint8Array(receivedBytes);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.length;
  }

  return new TextDecoder("utf-8", { fatal: false }).decode(merged);
}

/**
 * Extract image from HTML with Cheerio in strict order:
 * 1. og:image
 * 2. og:image:secure_url
 * 3. twitter:image
 * 4. link rel="image_src"
 * Rejects logos or tiny icons.
 */
function extractImageFromHtml(html: string, baseUrl: string): string | null {
  if (!html) return null;

  try {
    const $ = cheerio.load(html);

    const candidates = [
      $('meta[property="og:image"]').attr("content"),
      $('meta[name="og:image"]').attr("content"),
      $('meta[property="og:image:secure_url"]').attr("content"),
      $('meta[name="og:image:secure_url"]').attr("content"),
      $('meta[name="twitter:image"]').attr("content"),
      $('meta[property="twitter:image"]').attr("content"),
      $('meta[name="twitter:image:src"]').attr("content"),
      $('link[rel="image_src"]').attr("href"),
    ];

    for (const raw of candidates) {
      if (!raw || typeof raw !== "string") continue;
      const trimmed = raw.trim();
      if (!trimmed) continue;

      let absolute = "";
      try {
        absolute = new URL(trimmed, baseUrl).href;
      } catch {
        continue;
      }

      if (!absolute.startsWith("http://") && !absolute.startsWith("https://")) {
        continue;
      }

      // Reject images that are clearly logos or tiny icons
      const lower = absolute.toLowerCase();
      if (
        lower.includes("logo") ||
        lower.includes("favicon") ||
        lower.includes("icon-") ||
        lower.endsWith(".svg")
      ) {
        continue;
      }

      return absolute;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Full thumbnail pipeline for an article URL:
 * Checks cache -> decodes Google link -> fetches HTML (first 300KB) -> extracts image.
 * Uses semaphore to limit to at most 4 requests in parallel.
 * Never throws, returns reason for diagnosis.
 */
export async function getThumbnailDetails(
  articleUrl: string
): Promise<{ image: string | null; publisherUrl: string | null; reason: string }> {
  if (!articleUrl) {
    return { image: null, publisherUrl: null, reason: "Empty article URL" };
  }

  const now = Date.now();
  const cached = memoryCache.get(articleUrl);
  if (cached) {
    const ttl = cached.image ? SUCCESS_TTL : FAILURE_TTL;
    if (now - cached.timestamp < ttl) {
      return {
        image: cached.image,
        publisherUrl: cached.publisherUrl,
        reason: cached.image ? "Cached (HIT)" : "Cached Failure (HIT)",
      };
    }
  }

  // Deduplicate in-flight requests for the same URL
  if (inFlightPromises.has(articleUrl)) {
    return inFlightPromises.get(articleUrl)!;
  }

  const promise = (async () => {
    await concurrencyLimiter.acquire();
    try {
      // 1. Resolve publisher URL from Google redirect link
      let publisherUrl = articleUrl;
      if (articleUrl.includes("news.google.com")) {
        publisherUrl = (await resolveGoogleNewsUrl(articleUrl)) || "";
      }

      if (!publisherUrl || publisherUrl.includes("news.google.com")) {
        const failEntry: CacheEntry = {
          image: null,
          publisherUrl: null,
          timestamp: Date.now(),
        };
        memoryCache.set(articleUrl, failEntry);
        scheduleSaveCache();
        return {
          image: null,
          publisherUrl: null,
          reason: "Decode failed (stayed on Google News)",
        };
      }

      // 2. Fetch publisher HTML
      let html = "";
      try {
        html = await fetchFirst300KB(publisherUrl);
      } catch (err: any) {
        const failEntry: CacheEntry = {
          image: null,
          publisherUrl,
          timestamp: Date.now(),
        };
        memoryCache.set(articleUrl, failEntry);
        scheduleSaveCache();
        return {
          image: null,
          publisherUrl,
          reason: `Publisher fetch failed (${err?.message || "timeout/blocked"})`,
        };
      }

      if (!html) {
        const failEntry: CacheEntry = {
          image: null,
          publisherUrl,
          timestamp: Date.now(),
        };
        memoryCache.set(articleUrl, failEntry);
        scheduleSaveCache();
        return {
          image: null,
          publisherUrl,
          reason: "Publisher returned empty body or blocked",
        };
      }

      // 3. Extract og:image / twitter:image
      const image = extractImageFromHtml(html, publisherUrl);
      const entry: CacheEntry = {
        image,
        publisherUrl,
        timestamp: Date.now(),
      };
      memoryCache.set(articleUrl, entry);
      scheduleSaveCache();

      if (image) {
        return { image, publisherUrl, reason: "OK" };
      } else {
        return {
          image: null,
          publisherUrl,
          reason: "No valid og:image found in HTML",
        };
      }
    } finally {
      concurrencyLimiter.release();
      inFlightPromises.delete(articleUrl);
    }
  })();

  inFlightPromises.set(articleUrl, promise);
  return promise;
}

/**
 * Simple helper returning just the image URL or null
 */
export async function getThumbnail(articleUrl: string): Promise<string | null> {
  const result = await getThumbnailDetails(articleUrl);
  return result.image;
}
