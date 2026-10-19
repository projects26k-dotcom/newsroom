import Parser from "rss-parser";
import { FEEDS, FeedConfig } from "../src/lib/feeds";
import { getThumbnailDetails } from "../src/lib/thumb";

const rssParser = new Parser({
  customFields: {
    item: [["source", "source"]],
  },
});

interface ChannelResult {
  channel: string;
  total: number;
  success: number;
}

async function fetchFeedItems(feed: FeedConfig, count = 5): Promise<{ title: string; link: string }[]> {
  try {
    const res = await fetch(feed.url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
        Accept: "application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8",
      },
      signal: AbortSignal.timeout(6000),
    });

    if (!res.ok) {
      // Fallback for feeds that might need en-IN
      if (feed.url.includes("hl=hi") && feed.url.includes("site:")) {
        const fallbackUrl = feed.url.replace("hl=hi&gl=IN&ceid=IN:hi", "hl=en-IN&gl=IN&ceid=IN:en");
        const fbRes = await fetch(fallbackUrl);
        if (fbRes.ok) {
          const parsed = await rssParser.parseString(await fbRes.text());
          return (parsed.items || []).slice(0, count).map((i) => ({
            title: i.title || "Untitled",
            link: i.link || "",
          }));
        }
      }
      return [];
    }

    let parsed = await rssParser.parseString(await res.text());
    let items = parsed.items || [];

    // If channel search returned 0 items with hl=hi (e.g., The Hindu), try en-IN
    if (items.length === 0 && feed.url.includes("hl=hi") && feed.url.includes("site:")) {
      const fallbackUrl = feed.url.replace("hl=hi&gl=IN&ceid=IN:hi", "hl=en-IN&gl=IN&ceid=IN:en");
      const fbRes = await fetch(fallbackUrl);
      if (fbRes.ok) {
        parsed = await rssParser.parseString(await fbRes.text());
        items = parsed.items || [];
      }
    }

    return items
      .filter((i) => i.link && i.link.includes("news.google.com"))
      .slice(0, count)
      .map((i) => ({
        title: i.title || "Untitled",
        link: i.link || "",
      }));
  } catch (err: any) {
    console.error(`Error fetching feed ${feed.name}:`, err.message);
    return [];
  }
}

async function main() {
  console.log("================================================================================");
  console.log("DIAGNOSTIC TEST: GOOGLE NEWS THUMBNAIL RESOLUTION PIPELINE");
  console.log("================================================================================\n");

  // Feeds to test: India, Hindi, and 6 channels
  const targetFeedIds = ["india", "hindi", "aajtak", "abp", "news24", "ndtv", "bbc", "thehindu"];
  const feedsToTest = targetFeedIds
    .map((id) => FEEDS.find((f) => f.id === id))
    .filter((f): f is FeedConfig => Boolean(f));

  const summaries: ChannelResult[] = [];

  for (const feed of feedsToTest) {
    console.log(`\nFetching 5 articles from: ${feed.name} (${feed.url})`);
    const items = await fetchFeedItems(feed, 5);

    if (items.length === 0) {
      console.log(`${feed.name} | FAIL | NONE | No articles returned from feed URL`);
      summaries.push({ channel: feed.name, total: 0, success: 0 });
      continue;
    }

    let channelSuccess = 0;

    for (const item of items) {
      const { image, publisherUrl, reason } = await getThumbnailDetails(item.link);

      const pubDisplay = publisherUrl || "FAIL";
      const imgDisplay = image || "NONE";

      console.log(`${feed.name} | ${pubDisplay} | ${imgDisplay} | ${reason}`);

      if (image) {
        channelSuccess++;
      }
    }

    summaries.push({
      channel: feed.name,
      total: items.length,
      success: channelSuccess,
    });
  }

  console.log("\n================================================================================");
  console.log("SUMMARY: THUMBNAIL EXTRACTION SUCCESS PER CHANNEL");
  console.log("================================================================================");
  let totalArticles = 0;
  let totalSuccesses = 0;

  for (const s of summaries) {
    console.log(`${s.channel.padEnd(15)} : ${s.success}/${s.total}`);
    totalArticles += s.total;
    totalSuccesses += s.success;
  }
  console.log("--------------------------------------------------------------------------------");
  console.log(`TOTAL           : ${totalSuccesses}/${totalArticles} (${((totalSuccesses / (totalArticles || 1)) * 100).toFixed(1)}%)`);
  console.log("================================================================================\n");
}

main().catch(console.error);
