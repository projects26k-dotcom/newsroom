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
const FAILURE_TTL_MS = 60 * 1000;      // 60 seconds

const CHROME_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36";

/**
 * Extract channelId from YouTube watch page videoDetails JSON
 */
function extractVideoDetailsChannelId(html: string): string | null {
  const vdMatch = html.match(/"videoDetails":\{.*?"channelId":"([^"]+)"/);
  if (vdMatch) return vdMatch[1];

  const extMatch = html.match(/"externalChannelId":"([^"]+)"/);
  if (extMatch) return extMatch[1];

  const metaMatch = html.match(/itemprop="channelId"\s+content="([^"]+)"/);
  if (metaMatch) return metaMatch[1];

  return null;
}

/**
 * Check if video allows embedding via official oEmbed API (must return 200)
 */
async function checkOembed(videoId: string): Promise<boolean> {
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
 * Get current live video ID and embeddability for a channel.
 * Server-side, cached 5m on success / 60s on failure, never throws.
 *
 * New robust method:
 * 1. Prefers channel.liveVideoId override if present.
 * 2. Fetches the channel's region-independent RSS feed (videos.xml) and takes 8 newest IDs.
 * 3. Checks each ID on watch page: requires "isLiveNow":true, channelId match, and oEmbed 200.
 * 4. Returns newest passing video. Never picks unrelated/recommended IDs.
 */
export async function getLiveVideoId(
  channel: ChannelConfig | ResolvedChannel
): Promise<LiveVideoResult | null> {
  try {
    // 1. Manual override takes precedence if set
    if (channel.liveVideoId && channel.liveVideoId.trim().length > 0) {
      const manualVid = channel.liveVideoId.trim();
      const embeddable = await checkOembed(manualVid);
      console.log(`Live OK ${channel.name} ${manualVid}`);
      return { videoId: manualVid, embeddable };
    }

    // 2. Resolve YouTube channel ID
    const channelId =
      (channel as ResolvedChannel).resolvedId ||
      channel.youtubeChannelId ||
      (await resolveChannelId(channel));

    if (!channelId) {
      console.log(`Live not found ${channel.name}: blocked`);
      return null;
    }

    // 3. Check in-memory cache (5m for success, 60s for null)
    const cached = memoryCache.get(channelId);
    const now = Date.now();
    if (cached && now - cached.timestamp < cached.ttlMs) {
      return cached.result;
    }

    // 4. Fetch channel RSS feed (region-independent) with cache: "no-store"
    const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
    let rssRes: Response;
    try {
      rssRes = await fetch(rssUrl, {
        cache: "no-store",
        signal: AbortSignal.timeout(6000),
        headers: {
          "User-Agent": CHROME_UA,
          Accept: "application/rss+xml, application/xml, text/xml, */*",
        },
      });
    } catch {
      console.log(`Live not found ${channel.name}: blocked`);
      memoryCache.set(channelId, { result: null, timestamp: now, ttlMs: FAILURE_TTL_MS });
      return null;
    }

    if (!rssRes.ok) {
      console.log(`Live not found ${channel.name}: blocked`);
      memoryCache.set(channelId, { result: null, timestamp: now, ttlMs: FAILURE_TTL_MS });
      return null;
    }

    const xml = await rssRes.text();
    const videoIds: string[] = [];
    const matches = xml.matchAll(/<yt:videoId>([^<]+)<\/yt:videoId>/g);
    for (const m of matches) {
      videoIds.push(m[1]);
    }

    // Take 8 newest video IDs
    const candidates = videoIds.slice(0, 8);
    if (candidates.length === 0) {
      console.log(`Live not found ${channel.name}: not live`);
      memoryCache.set(channelId, { result: null, timestamp: now, ttlMs: FAILURE_TTL_MS });
      return null;
    }

    let failureReason = "not live";

    // 5. Inspect candidates in order (newest first)
    for (const vid of candidates) {
      try {
        const watchUrl = `https://www.youtube.com/watch?v=${vid}`;
        const wRes = await fetch(watchUrl, {
          cache: "no-store",
          signal: AbortSignal.timeout(6000),
          headers: {
            "User-Agent": CHROME_UA,
            "Accept-Language": "en-IN,en;q=0.9",
            Cookie: "SOCS=CAI; CONSENT=YES+1",
          },
        });

        if (!wRes.ok) continue;

        const html = await wRes.text();

        // Check 1: Must contain "isLiveNow":true
        const isLiveNow = html.includes('"isLiveNow":true');
        if (!isLiveNow) {
          continue;
        }

        // Check 2: videoDetails channelId must match this channel's youtubeChannelId
        const pageChannelId = extractVideoDetailsChannelId(html);
        if (pageChannelId !== channelId) {
          failureReason = "channel mismatch";
          continue;
        }

        // Check 3: oEmbed must return 200 (embedding allowed)
        const embeddable = await checkOembed(vid);
        if (!embeddable) {
          failureReason = "not embeddable";
          continue;
        }

        // ALL CHECKS PASSED
        console.log(`Live OK ${channel.name} ${vid}`);
        const result: LiveVideoResult = { videoId: vid, embeddable: true };
        memoryCache.set(channelId, { result, timestamp: now, ttlMs: SUCCESS_TTL_MS });
        return result;
      } catch {
        continue;
      }
    }

    // None passed
    console.log(`Live not found ${channel.name}: ${failureReason}`);
    memoryCache.set(channelId, { result: null, timestamp: now, ttlMs: FAILURE_TTL_MS });
    return null;
  } catch (err: any) {
    console.log(`Live not found ${channel.name}: blocked`);
    return null;
  }
}
