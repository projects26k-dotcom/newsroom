import { ChannelConfig, ResolvedChannel, resolveChannelId } from "./channels";

export interface LiveVideoResult {
  videoId: string;
  embeddable: boolean;
}

interface CacheEntry {
  result: LiveVideoResult | null;
  timestamp: number;
}

const liveCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Check if a YouTube video allows embedding by querying the official oEmbed API.
 * If it returns 401 or 403, embedding is restricted.
 */
async function checkEmbeddable(videoId: string): Promise<boolean> {
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
      {
        signal: AbortSignal.timeout(4000),
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
        },
      }
    );

    if (res.status === 401 || res.status === 403) {
      return false;
    }
    return res.ok;
  } catch {
    // If oEmbed times out, allow embedding attempt
    return true;
  }
}

/**
 * Get current live video ID and embeddability for a channel.
 * Server-side, cached 10 minutes in memory, never throws.
 */
export async function getLiveVideoId(
  channel: ChannelConfig | ResolvedChannel
): Promise<LiveVideoResult | null> {
  try {
    // 1. Manual override takes precedence if set
    if (channel.liveVideoId && channel.liveVideoId.trim().length > 0) {
      const vid = channel.liveVideoId.trim();
      const embeddable = await checkEmbeddable(vid);
      console.log(`Live OK ${channel.name} ${vid} embeddable=${embeddable}`);
      return { videoId: vid, embeddable };
    }

    // 2. Resolve YouTube channel ID
    const channelId =
      (channel as ResolvedChannel).resolvedId ||
      channel.youtubeChannelId ||
      (await resolveChannelId(channel));

    if (!channelId) {
      console.log(`Live not found ${channel.name}: channelId not found`);
      return null;
    }

    // 3. Check 10-minute in-memory cache
    const cached = liveCache.get(channelId);
    const now = Date.now();
    if (cached && now - cached.timestamp < CACHE_TTL_MS) {
      return cached.result;
    }

    // 4. Fetch https://www.youtube.com/channel/<channelId>/live
    const liveUrl = `https://www.youtube.com/channel/${channelId}/live`;
    const res = await fetch(liveUrl, {
      signal: AbortSignal.timeout(6000),
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
        "Accept-Language": "en-IN,en;q=0.9",
        Cookie: "SOCS=CAI; CONSENT=YES+1",
      },
    });

    if (!res.ok) {
      console.log(`Live not found ${channel.name}: HTTP ${res.status}`);
      liveCache.set(channelId, { result: null, timestamp: now });
      return null;
    }

    const html = await res.text();

    // 5. Must contain "isLive":true or "isLiveNow":true
    const isLive = html.includes('"isLive":true') || html.includes('"isLiveNow":true');
    if (!isLive) {
      console.log(`Live not found ${channel.name}: channel is not currently live`);
      liveCache.set(channelId, { result: null, timestamp: now });
      return null;
    }

    // 6. Read video ID from canonical link or videoId JSON pattern
    const canonicalMatch = html.match(
      /<link[^>]*rel="canonical"[^>]*href="https:\/\/www\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})"/
    );
    let videoId = canonicalMatch ? canonicalMatch[1] : null;

    if (!videoId) {
      const vMatch = html.match(/"videoId":"([a-zA-Z0-9_-]{11})"/);
      if (vMatch) videoId = vMatch[1];
    }

    if (!videoId) {
      console.log(`Live not found ${channel.name}: videoId pattern not found in live page`);
      liveCache.set(channelId, { result: null, timestamp: now });
      return null;
    }

    // 7. Verify embedding is permitted via oEmbed
    const embeddable = await checkEmbeddable(videoId);

    console.log(`Live OK ${channel.name} ${videoId} embeddable=${embeddable}`);
    const result: LiveVideoResult = { videoId, embeddable };
    liveCache.set(channelId, { result, timestamp: now });
    return result;
  } catch (err: any) {
    console.log(`Live not found ${channel.name}: ${err?.message || "Error fetching live video"}`);
    return null;
  }
}
