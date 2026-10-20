import Parser from "rss-parser";
import { getResolvedChannels, ResolvedChannel } from "./channels";
import { decodeHtmlEntities } from "./utils";
import { extractYouTubeId } from "./article";

export interface VideoItem {
  id: string; // YouTube Video ID
  title: string;
  link: string;
  published: string;
  publishedTimestamp: number;
  timeAgo: string;
  thumbnail: string;
  channelName: string;
  channelSlug: string;
  channelId: string;
  duration?: string | null;
}

const parser = new Parser({
  customFields: {
    item: [
      ["media:group", "mediaGroup"],
      ["yt:videoId", "videoId"],
      ["yt:channelId", "channelId"],
    ],
  },
});

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
 * Fetch video items for a single resolved channel
 */
async function fetchChannelVideos(channel: ResolvedChannel): Promise<VideoItem[]> {
  const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channel.resolvedId}`;

  const attemptFetch = async (): Promise<Response> => {
    return fetch(feedUrl, {
      next: { revalidate: 600 },
      signal: AbortSignal.timeout(6000),
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
        Accept: "application/rss+xml, application/xml, text/xml, */*",
      },
    });
  };

  try {
    let res: Response;
    try {
      res = await attemptFetch();
      if (!res.ok) {
        // Retry once after 300ms
        await new Promise((r) => setTimeout(r, 300));
        res = await attemptFetch();
      }
    } catch {
      await new Promise((r) => setTimeout(r, 300));
      res = await attemptFetch();
    }

    if (!res.ok) {
      console.log(`Videos failed: ${channel.name} (HTTP ${res.status})`);
      return [];
    }

    const xml = await res.text();
    const parsed = await parser.parseString(xml);
    const rawItems = parsed.items || [];

    const videos: VideoItem[] = [];

    for (const it of rawItems) {
      const rawId = (it as any).id || it.guid || "";
      const videoId =
        (it as any).videoId ||
        extractYouTubeId(it.link) ||
        (typeof rawId === "string" ? rawId.split(":").pop() : null);

      if (!videoId) continue;

      let thumbnail = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
      const mg = (it as any).mediaGroup;
      if (mg && mg["media:thumbnail"]) {
        const rawThumb = mg["media:thumbnail"];
        if (Array.isArray(rawThumb) && rawThumb[0]?.$?.url) {
          thumbnail = rawThumb[0].$.url;
        } else if (rawThumb?.$?.url) {
          thumbnail = rawThumb.$.url;
        }
      }

      let duration: string | null = null;
      if (mg && mg["media:content"]) {
        const rawContent = mg["media:content"];
        const durSec = Array.isArray(rawContent)
          ? parseInt(rawContent[0]?.$?.duration || "0", 10)
          : parseInt(rawContent?.$?.duration || "0", 10);
        if (durSec && durSec > 0) {
          const m = Math.floor(durSec / 60);
          const s = durSec % 60;
          duration = `${m}:${s < 10 ? "0" : ""}${s}`;
        }
      }

      const dateStr = it.pubDate || (it as any).published || (it as any).isoDate || "";
      const { timeAgo, timestamp } = formatTimeAgo(dateStr);

      videos.push({
        id: videoId,
        title: decodeHtmlEntities(it.title || "Untitled Video"),
        link: it.link || `https://www.youtube.com/watch?v=${videoId}`,
        published: dateStr,
        publishedTimestamp: timestamp,
        timeAgo,
        thumbnail,
        channelName: channel.name,
        channelSlug: channel.slug,
        channelId: channel.resolvedId,
        duration,
      });
    }

    console.log(`Videos loaded: ${channel.name} ${videos.length} items`);
    return videos;
  } catch (err: any) {
    console.log(`Videos failed: ${channel.name} (${err.message || "Timeout / fetch error"})`);
    return [];
  }
}

/**
 * Fetch and merge videos from all resolved channels in parallel
 */
export async function getAllVideos(): Promise<{ videos: VideoItem[]; channels: ResolvedChannel[] }> {
  const channels = await getResolvedChannels();

  const results = await Promise.allSettled(
    channels.map((channel) => fetchChannelVideos(channel))
  );

  const allVideos: VideoItem[] = [];
  for (const res of results) {
    if (res.status === "fulfilled" && Array.isArray(res.value)) {
      allVideos.push(...res.value);
    }
  }

  // Sort newest first
  allVideos.sort((a, b) => b.publishedTimestamp - a.publishedTimestamp);

  return {
    videos: allVideos,
    channels,
  };
}

/**
 * Fetch top N latest videos for the home page row
 */
export async function getLatestVideos(count: number = 6): Promise<VideoItem[]> {
  const { videos } = await getAllVideos();
  return videos.slice(0, count);
}
