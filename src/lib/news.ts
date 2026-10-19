import "server-only";
import Parser from "rss-parser";
import * as cheerio from "cheerio";
import { FeedConfig } from "./feeds";
import { encodeArticleId } from "./encoder";

export interface RelatedArticle {
  title: string;
  url: string;
  source: string;
  articleId: string;
}

export interface Article {
  id: string;
  articleId: string;
  title: string;
  url: string;
  source: string;
  pubDate: string;
  timeAgo: string;
  timestamp: number;
  related: RelatedArticle[];
  category?: string;
  language?: string;
}


export interface NewsResult {
  articles: Article[];
  error?: string | null;
}

const rssParser = new Parser({
  customFields: {
    item: [
      ["source", "source"],
      ["description", "description"],
    ],
  },
});

/**
 * Remove " - <Source>" suffix from title and extract source
 */
function parseTitleAndSource(rawTitle: string, rawSource?: any): { title: string; source: string } {
  let source = "";

  if (typeof rawSource === "string") {
    source = rawSource.trim();
  } else if (rawSource && typeof rawSource === "object") {
    source = (rawSource._ || rawSource["#text"] || rawSource.title || "").trim();
  }

  let title = (rawTitle || "").trim();

  // Look for the last " - " delimiter (Google News standard suffix)
  const lastDashIndex = title.lastIndexOf(" - ");
  if (lastDashIndex !== -1) {
    const extractedSource = title.slice(lastDashIndex + 3).trim();
    title = title.slice(0, lastDashIndex).trim();
    if (!source) {
      source = extractedSource;
    }
  }

  if (!source) {
    source = "News";
  }

  return { title, source };
}

/**
 * Parse <ol> of related coverage in <description> using Cheerio
 * Up to 3 related articles (link + title + source in a <font> tag)
 */
function parseRelatedCoverage(descriptionHtml?: string): RelatedArticle[] {
  if (!descriptionHtml) return [];

  try {
    const $ = cheerio.load(descriptionHtml);
    const related: RelatedArticle[] = [];

    $("ol li").each((i, el) => {
      // First <li> is the main article headline itself
      // Subsequent <li> elements are the related articles
      if (i > 0 && related.length < 3) {
        const a = $(el).find("a");
        const font = $(el).find("font");
        const title = a.text().trim();
        const url = a.attr("href") || "";
        const source = font.text().trim() || "Coverage";

        if (title && url) {
          related.push({ title, url, source, articleId: encodeArticleId(url) });
        }
      }
    });

    return related;
  } catch {
    return [];
  }
}

/**
 * Parse pubDate into timestamp and relative "time ago"
 */
function formatTimeAgo(pubDateStr?: string): { timeAgo: string; timestamp: number } {
  if (!pubDateStr) return { timeAgo: "Recently", timestamp: 0 };

  const date = new Date(pubDateStr);
  const timestamp = isNaN(date.getTime()) ? 0 : date.getTime();
  if (!timestamp) return { timeAgo: "Recently", timestamp: 0 };

  const diffSec = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (diffSec < 60) return { timeAgo: "Just now", timestamp };

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin === 1) return { timeAgo: "1m ago", timestamp };
  if (diffMin < 60) return { timeAgo: `${diffMin}m ago`, timestamp };

  const diffHours = Math.floor(diffMin / 60);
  if (diffHours === 1) return { timeAgo: "1h ago", timestamp };
  if (diffHours < 24) return { timeAgo: `${diffHours}h ago`, timestamp };

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return { timeAgo: "Yesterday", timestamp };
  if (diffDays < 7) return { timeAgo: `${diffDays}d ago`, timestamp };

  return {
    timeAgo: date.toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
    timestamp,
  };
}

/**
 * Fetch raw XML text with Next.js revalidate = 300
 */
async function fetchXmlWithCache(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      next: { revalidate: 300 },
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
        Accept: "application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8",
      },
    });

    if (!res.ok) {
      return null;
    }

    return await res.text();
  } catch {
    return null;
  }
}

/**
 * Fetch a single Google News RSS feed with Next.js revalidation cache (300 seconds)
 */
async function fetchSingleFeed(feed: FeedConfig): Promise<Article[]> {
  try {
    let xml = await fetchXmlWithCache(feed.url);

    if (!xml) {
      console.warn(`[Feed FAIL] ${feed.name}: Could not fetch XML`);
      return [];
    }

    let parsed = await rssParser.parseString(xml);
    let items = parsed.items || [];

    // For channel searches where hl=hi returns limited items for primarily English sources (e.g. The Hindu, NDTV),
    // fetch the en-IN feed and merge to ensure readers receive the full 100 dispatches
    if (items.length < 20 && feed.url.includes("hl=hi") && feed.url.includes("site:")) {
      const enUrl = feed.url.replace("hl=hi&gl=IN&ceid=IN:hi", "hl=en-IN&gl=IN&ceid=IN:en");
      const enXml = await fetchXmlWithCache(enUrl);
      if (enXml) {
        const enParsed = await rssParser.parseString(enXml);
        if (enParsed.items && enParsed.items.length > 0) {
          const combined = [...items, ...enParsed.items];
          // deduplicate raw items by guid or link
          const seen = new Set<string>();
          items = combined.filter((i) => {
            const key = i.guid || i.link || i.title || "";
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });
        }
      }
    }

    // STEP 6: Required console log
    console.log(`Feed OK: ${feed.name} ${items.length} items`);

    return items.map((item, idx) => {
      const { title, source } = parseTitleAndSource(item.title || "", item.source);
      const { timeAgo, timestamp } = formatTimeAgo(item.pubDate);
      const related = parseRelatedCoverage(item.description);

      const articleId = encodeArticleId(item.link || "");

      return {
        id: item.guid || item.link || `${feed.id}-${idx}`,
        articleId,
        title,
        url: item.link || "#",
        source,
        pubDate: item.pubDate || "",
        timeAgo,
        timestamp,
        related,
        category: feed.category,
        language: feed.language,
      };
    });
  } catch (err) {
    console.warn(`[Feed FAIL] ${feed.name}:`, err);
    return [];
  }
}

/**
 * Fetch feeds in parallel with Promise.allSettled, merge, deduplicate by title, and sort newest first
 */
export async function getNews(feedsToFetch: FeedConfig[]): Promise<NewsResult> {
  if (!feedsToFetch || feedsToFetch.length === 0) {
    return {
      articles: [],
      error: "News temporarily unavailable, refresh in a minute",
    };
  }

  const settled = await Promise.allSettled(feedsToFetch.map((f) => fetchSingleFeed(f)));

  const allArticles: Article[] = [];
  for (const result of settled) {
    if (result.status === "fulfilled" && Array.isArray(result.value)) {
      allArticles.push(...result.value);
    }
  }

  // Deduplicate articles by normalized title
  const seenTitles = new Set<string>();
  const uniqueArticles: Article[] = [];

  for (const article of allArticles) {
    if (!article.title || article.title.length < 5) continue;

    // Normalize title to catch duplicate syndicate coverage
    const normalized = article.title
      .toLowerCase()
      .replace(/[^\w\s\u0900-\u097F]/g, "")
      .replace(/\s+/g, " ")
      .trim();

    if (!seenTitles.has(normalized)) {
      seenTitles.add(normalized);
      uniqueArticles.push(article);
    }
  }

  // Sort newest first by pubDate timestamp
  uniqueArticles.sort((a, b) => b.timestamp - a.timestamp);

  if (uniqueArticles.length === 0) {
    return {
      articles: [],
      error: "News temporarily unavailable, refresh in a minute",
    };
  }

  return {
    articles: uniqueArticles,
    error: null,
  };
}

/**
 * Query search feeds on Google News RSS
 */
export async function searchNews(query: string): Promise<NewsResult> {
  if (!query || query.trim().length === 0) {
    return { articles: [], error: null };
  }

  const encodedQuery = encodeURIComponent(query.trim());
  const searchFeed: FeedConfig = {
    id: "search",
    name: `Search: ${query}`,
    url: `https://news.google.com/rss/search?q=${encodedQuery}+when:1d&hl=en-IN&gl=IN&ceid=IN:en`,
    category: "search",
    language: "en",
  };

  return getNews([searchFeed]);
}
