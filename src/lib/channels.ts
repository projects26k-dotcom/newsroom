/**
 * ============================================================================
 * CHANNEL CONFIGURATION GUIDE:
 * ============================================================================
 * To specify or override a YouTube Channel ID manually:
 * 1. Open the YouTube channel page in your web browser.
 * 2. View page source (Ctrl+U or Right-Click -> View Page Source) and search for:
 *    - 'channel_id='
 *    - 'channelId'
 *    - or copy it from the canonical link (e.g., https://www.youtube.com/channel/UC...)
 * 3. Paste the 24-character ID (starts with "UC", e.g. "UCt4t-jeY85JegMlZ-E5UWtA")
 *    into the `youtubeChannelId` field below.
 * 4. If `youtubeChannelId` is left as an empty string (""), the system automatically
 *    fetches https://www.youtube.com/<handle> server-side, extracts the channel ID,
 *    and caches it in /tmp for 7 days.
 * 5. To manually force a specific YouTube live stream video ID (e.g. for special broadcasts),
 *    paste the 11-character video ID into the optional `liveVideoId` field.
 * ============================================================================
 */

import fs from "fs";
import path from "path";

export interface ChannelConfig {
  name: string;
  slug: string;
  language: "en" | "hi";
  youtubeChannelId: string;
  youtubeHandle: string;
  liveVideoId?: string;
}

export interface ResolvedChannel extends ChannelConfig {
  resolvedId: string;
}

export const CHANNELS: ChannelConfig[] = [
  {
    name: "Aaj Tak",
    slug: "aajtak",
    language: "hi",
    youtubeChannelId: "UCt4t-jeY85JegMlZ-E5UWtA",
    youtubeHandle: "@aajtak",
    liveVideoId: "",
  },
  {
    name: "ABP News",
    slug: "abp-news",
    language: "hi",
    youtubeChannelId: "UCRWFSbif-RFENbBrSiez1DA",
    youtubeHandle: "@abpnews",
    liveVideoId: "",
  },
  {
    name: "News24",
    slug: "news24",
    language: "hi",
    youtubeChannelId: "UCuzS3rPQAYqHcLWqOFuY0pw",
    youtubeHandle: "@news24thinkfirst",
    liveVideoId: "",
  },
  {
    name: "NDTV India",
    slug: "ndtv-india",
    language: "hi",
    youtubeChannelId: "UC9CYT9gSNLevX5ey2_6CK0Q",
    youtubeHandle: "@ndtvindia",
    liveVideoId: "",
  },
  {
    name: "NDTV (English)",
    slug: "ndtv-english",
    language: "en",
    youtubeChannelId: "UCZFMm1mMw0F81Z37aaEzTUA",
    youtubeHandle: "@NDTV",
    liveVideoId: "",
  },
  {
    name: "BBC News",
    slug: "bbc-news",
    language: "en",
    youtubeChannelId: "UC16niRr50-MSBwiO3YDb3RA",
    youtubeHandle: "@BBCNews",
    liveVideoId: "",
  },
  {
    name: "Al Jazeera English",
    slug: "al-jazeera-english",
    language: "en",
    youtubeChannelId: "UCNye-wNBqNL5ZzHSJj3l8Bg",
    youtubeHandle: "@aljazeeraenglish",
    liveVideoId: "",
  },
  {
    name: "WION",
    slug: "wion",
    language: "en",
    youtubeChannelId: "UC_gUM8rL-Lrg6O3adPW9K1g",
    youtubeHandle: "@WION",
    liveVideoId: "",
  },
];

const CACHE_FILE = path.join("/tmp", "newsroom_yt_channels.json");
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

interface ChannelCacheEntry {
  channelId: string;
  timestamp: number;
}

const memoryCache = new Map<string, ChannelCacheEntry>();

function loadCache(): void {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const raw = fs.readFileSync(CACHE_FILE, "utf-8");
      const data = JSON.parse(raw);
      for (const [key, val] of Object.entries(data)) {
        memoryCache.set(key, val as ChannelCacheEntry);
      }
    }
  } catch {
    // Ignore cache load failure
  }
}

function saveCache(): void {
  try {
    const obj: Record<string, ChannelCacheEntry> = {};
    const now = Date.now();
    for (const [key, val] of memoryCache.entries()) {
      if (now - val.timestamp < CACHE_TTL_MS) {
        obj[key] = val;
      }
    }
    fs.writeFileSync(CACHE_FILE, JSON.stringify(obj, null, 2), "utf-8");
  } catch {
    // Ignore cache write failure
  }
}

// Initial cache load
loadCache();

/**
 * Resolve a single channel's YouTube channel ID.
 * Uses manual ID if set, or resolves via handle with 7-day disk/memory cache.
 */
export async function resolveChannelId(channel: ChannelConfig): Promise<string | null> {
  // If manual ID is filled, use it directly
  if (channel.youtubeChannelId && channel.youtubeChannelId.trim().length > 0) {
    return channel.youtubeChannelId.trim();
  }

  const handle = channel.youtubeHandle ? channel.youtubeHandle.trim() : "";
  if (!handle) {
    console.log(`Channel failed: ${channel.name} (no handle or channelId specified)`);
    return null;
  }

  const cacheKey = handle.toLowerCase();
  const cached = memoryCache.get(cacheKey);
  const now = Date.now();

  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return cached.channelId;
  }

  const cleanHandle = handle.startsWith("@") ? handle : `@${handle}`;
  const url = `https://www.youtube.com/${cleanHandle}`;

  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(6000),
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });

    if (!res.ok) {
      console.log(`Channel failed: ${channel.name} (HTTP ${res.status})`);
      return null;
    }

    const html = await res.text();

    // 1. Check canonical link: <link rel="canonical" href="https://www.youtube.com/channel/(UC...)">
    let match = html.match(
      /<link[^>]*rel="canonical"[^>]*href="https:\/\/www\.youtube\.com\/channel\/([a-zA-Z0-9_-]{20,})"/
    );

    // 2. Check "channelId":"(UC...)"
    if (!match) {
      match = html.match(/"channelId":"([a-zA-Z0-9_-]{20,})"/);
    }

    // 3. Check itemprop="channelId" content="(UC...)"
    if (!match) {
      match = html.match(/itemprop="channelId"\s+content="([a-zA-Z0-9_-]{20,})"/);
    }

    // 4. Check channel_id=(UC...)
    if (!match) {
      match = html.match(/channel_id=([a-zA-Z0-9_-]{20,})/);
    }

    if (match && match[1]) {
      const channelId = match[1];
      console.log(`Channel resolved: ${channel.name} -> ${channelId}`);
      memoryCache.set(cacheKey, { channelId, timestamp: now });
      saveCache();
      return channelId;
    }

    console.log(`Channel failed: ${channel.name} (ID pattern not found in page)`);
    return null;
  } catch (err: any) {
    console.log(`Channel failed: ${channel.name} (${err.message || "Timeout / fetch error"})`);
    return null;
  }
}

/**
 * Resolve all configured channels in parallel
 */
export async function getResolvedChannels(): Promise<ResolvedChannel[]> {
  const results = await Promise.allSettled(
    CHANNELS.map(async (channel) => {
      const resolvedId = await resolveChannelId(channel);
      if (!resolvedId) return null;
      return {
        ...channel,
        resolvedId,
      } as ResolvedChannel;
    })
  );

  const resolved: ResolvedChannel[] = [];
  for (const res of results) {
    if (res.status === "fulfilled" && res.value) {
      resolved.push(res.value);
    }
  }

  return resolved;
}

export function getChannelBySlug(slug: string): ChannelConfig | undefined {
  return CHANNELS.find((c) => c.slug === slug.toLowerCase());
}
