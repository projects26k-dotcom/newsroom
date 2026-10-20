import { ChannelConfig, ResolvedChannel, resolveChannelId } from "./channels";

export interface LiveVideoResult {
  videoId: string;
  embeddable: boolean;
}

interface CacheEntry {
  result: LiveVideoResult | null;
  timestamp: number;
  ttlMs: number;
}

const memoryCache = new Map<string, CacheEntry>();
const SUCCESS_TTL_MS = 5 * 60 * 1000; // 5 minutes
const FAILURE_TTL_MS = 30 * 1000;      // 30 seconds

const CHROME_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36";

/**
 * Check if video allows embedding via official oEmbed API (must return 200)
 */
export async function checkOembed(videoId: string): Promise<boolean> {
  if (!videoId || videoId.length < 5) return false;
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
      {
        cache: "no-store",
        signal: AbortSignal.timeout(4000),
        headers: {
          "User-Agent": CHROME_UA,
        },
      }
    );
    return res.status === 200;
  } catch {
    return false;
  }
}

/**
 * Strategy 1: Resolve live stream video ID directly from YouTube handle /live page
 */
async function resolveViaHandleLive(handle?: string): Promise<string | null> {
  if (!handle || handle.trim().length === 0) return null;
  const cleanHandle = handle.trim().startsWith("@") ? handle.trim() : `@${handle.trim()}`;
  const liveUrl = `https://www.youtube.com/${cleanHandle}/live`;

  try {
    const res = await fetch(liveUrl, {
      cache: "no-store",
      signal: AbortSignal.timeout(4500),
      headers: {
        "User-Agent": CHROME_UA,
        "Accept-Language": "en-IN,en;q=0.9",
        Cookie: "SOCS=CAI; CONSENT=YES+1",
      },
    });

    if (!res.ok) return null;
    const html = await res.text();

    const mCanon = html.match(/rel="canonical"[^>]*href="[^"]*v=([a-zA-Z0-9_-]{11})"/);
    if (mCanon && mCanon[1]) {
      if (await checkOembed(mCanon[1])) {
        return mCanon[1];
      }
    }

    const mVid = html.match(/"videoId":"([a-zA-Z0-9_-]{11})"/);
    if (mVid && mVid[1]) {
      if (await checkOembed(mVid[1])) {
        return mVid[1];
      }
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Strategy 2 & 3: Parse channel RSS feed and verify candidate live streams via YouTube Innertube API or title heuristics
 */
async function resolveViaRssFeed(channelId: string): Promise<string | null> {
  try {
    const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
    const rssRes = await fetch(rssUrl, {
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
      headers: {
        "User-Agent": CHROME_UA,
        Accept: "application/rss+xml, application/xml, text/xml, */*",
      },
    });

    if (!rssRes.ok) return null;
    const xml = await rssRes.text();

    interface RssEntry {
      videoId: string;
      title: string;
    }
    const entries: RssEntry[] = [];
    const entryMatches = xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g);
    for (const em of entryMatches) {
      const eXml = em[1];
      const vidMatch = eXml.match(/<yt:videoId>([^<]+)<\/yt:videoId>/);
      const titleMatch = eXml.match(/<title>([^<]+)<\/title>/);
      if (vidMatch && vidMatch[1]) {
        entries.push({
          videoId: vidMatch[1],
          title: titleMatch ? titleMatch[1] : "",
        });
      }
    }

    if (entries.length === 0) return null;

    // Prioritize videos with LIVE / लाइव in the title
    entries.sort((a, b) => {
      const aLive = /\b(live|लाइव|जीवंत)\b/i.test(a.title);
      const bLive = /\b(live|लाइव|जीवंत)\b/i.test(b.title);
      if (aLive && !bLive) return -1;
      if (!aLive && bLive) return 1;
      return 0;
    });

    const candidates = entries.slice(0, 5);

    // Strategy 2: Check each candidate via Innertube Player API for active live broadcast
    for (const item of candidates) {
      try {
        const pres = await fetch("https://www.youtube.com/youtubei/v1/player", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            context: {
              client: { clientName: "WEB", clientVersion: "2.20240101.00.00" },
            },
            videoId: item.videoId,
          }),
          signal: AbortSignal.timeout(3000),
        });

        if (pres.ok) {
          const pdata = await pres.json();
          if (pdata.videoDetails?.isLive === true) {
            if (await checkOembed(item.videoId)) {
              return item.videoId;
            }
          }
        }
      } catch {
        // Continue to next candidate
      }
    }

    // Strategy 3: If Innertube was blocked or inconclusive, check candidates whose title clearly indicates a live broadcast
    for (const item of candidates) {
      if (/\b(live|लाइव|जीवंत)\b/i.test(item.title)) {
        if (await checkOembed(item.videoId)) {
          return item.videoId;
        }
      }
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Get current live video ID and embeddability for a channel.
 * Server-side, cached 5m on success / 30s on failure, never throws.
 *
 * Resilient multi-tier pipeline:
 * Tier 1: Explicit manual override (channel.liveVideoId)
 * Tier 2: Direct channel handle live stream (/live endpoint)
 * Tier 3: RSS feed candidates + YouTube Innertube player API
 * Tier 4: RSS feed candidate title heuristic + oEmbed verification
 * Tier 5: Channel default verified live video ID (defaultLiveVideoId)
 */
export async function getLiveVideoId(
  channel: ChannelConfig | ResolvedChannel
): Promise<LiveVideoResult | null> {
  try {
    // Tier 1: Manual override takes precedence if set
    if (channel.liveVideoId && channel.liveVideoId.trim().length > 0) {
      const manualVid = channel.liveVideoId.trim();
      const embeddable = await checkOembed(manualVid);
      console.log(`Live OK ${channel.name} ${manualVid} (manual override)`);
      return { videoId: manualVid, embeddable };
    }

    // Resolve YouTube channel ID
    const channelId =
      (channel as ResolvedChannel).resolvedId ||
      channel.youtubeChannelId ||
      (await resolveChannelId(channel));

    if (!channelId) {
      console.log(`Live not found ${channel.name}: no channelId`);
      return null;
    }

    // In-memory cache check
    const cached = memoryCache.get(channelId);
    const now = Date.now();
    if (cached && now - cached.timestamp < cached.ttlMs) {
      return cached.result;
    }

    // Tier 2: Try direct channel handle /live endpoint
    let foundVideoId = await resolveViaHandleLive(channel.youtubeHandle);

    // Tier 3 & 4: If not resolved via handle, try RSS feed + Innertube player
    if (!foundVideoId) {
      foundVideoId = await resolveViaRssFeed(channelId);
    }

    // Tier 5: Fallback to verified default broadcast ID
    if (!foundVideoId && channel.defaultLiveVideoId) {
      const defaultVid = channel.defaultLiveVideoId.trim();
      if (await checkOembed(defaultVid)) {
        foundVideoId = defaultVid;
        console.log(`Live fallback ${channel.name} ${foundVideoId} (defaultLiveVideoId)`);
      }
    }

    if (foundVideoId) {
      console.log(`Live OK ${channel.name} ${foundVideoId}`);
      const result: LiveVideoResult = { videoId: foundVideoId, embeddable: true };
      memoryCache.set(channelId, { result, timestamp: now, ttlMs: SUCCESS_TTL_MS });
      return result;
    }

    console.log(`Live not found ${channel.name}`);
    memoryCache.set(channelId, { result: null, timestamp: now, ttlMs: FAILURE_TTL_MS });
    return null;
  } catch (err: any) {
    console.log(`Live not found ${channel.name}: ${err?.message || "unknown error"}`);
    return null;
  }
}
