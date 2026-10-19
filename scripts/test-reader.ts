import Parser from "rss-parser";
import { FEEDS, FeedConfig } from "../src/lib/feeds";
import { getArticleByUrl, encodeArticleId } from "../src/lib/article";

const rssParser = new Parser();

interface ChannelTestResult {
  channel: string;
  total: number;
  fullText: number;
}

async function fetchFeedArticles(feed: FeedConfig, count = 3): Promise<{ title: string; link: string }[]> {
  try {
    let res = await fetch(feed.url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
      },
      signal: AbortSignal.timeout(6000),
    });

    let xml = "";
    if (res.ok) {
      xml = await res.text();
    }

    let parsed = xml ? await rssParser.parseString(xml) : { items: [] };
    let items = parsed.items || [];

    // Fallback if hl=hi returned 0 for English sources like The Hindu
    if (items.length === 0 && feed.url.includes("hl=hi") && feed.url.includes("site:")) {
      const fbUrl = feed.url.replace("hl=hi&gl=IN&ceid=IN:hi", "hl=en-IN&gl=IN&ceid=IN:en");
      const fbRes = await fetch(fbUrl);
      if (fbRes.ok) {
        const fbParsed = await rssParser.parseString(await fbRes.text());
        items = fbParsed.items || [];
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
    console.error(`Feed fetch error for ${feed.name}:`, err.message);
    return [];
  }
}

async function main() {
  console.log("================================================================================");
  console.log("READER MODE FULL-TEXT EXTRACTION TEST (3 ARTICLES PER CHANNEL)");
  console.log("================================================================================\n");

  const targetChannels = ["aajtak", "abp", "news24", "ndtv", "bbc", "thehindu"];
  const feedsToTest = targetChannels
    .map((id) => FEEDS.find((f) => f.id === id))
    .filter((f): f is FeedConfig => Boolean(f));

  const summaries: ChannelTestResult[] = [];

  for (const feed of feedsToTest) {
    console.log(`\n--- Channel: ${feed.name} ---`);
    const items = await fetchFeedArticles(feed, 3);

    if (items.length === 0) {
      console.log(`${feed.name}: Failed to get articles from feed.`);
      summaries.push({ channel: feed.name, total: 0, fullText: 0 });
      continue;
    }

    let channelSuccess = 0;

    for (let idx = 0; idx < items.length; idx++) {
      const item = items[idx];
      const articleId = encodeArticleId(item.link);
      const article = await getArticleByUrl(item.link);

      const hasFullText = !article.isFallback && article.charCount >= 300;
      if (hasFullText) {
        channelSuccess++;
      }

      console.log(
        `[${idx + 1}] ${feed.name} | ${article.domain} | ${article.charCount} chars | ${
          hasFullText ? "FULL TEXT (OK)" : `FALLBACK (${article.fallbackReason})`
        }`
      );
      console.log(`    Headline : ${article.title}`);
      console.log(`    Publisher: ${article.publisherUrl}`);
      console.log(`    Route    : /article/${articleId.slice(0, 25)}...`);
      if (article.leadImage) {
        console.log(`    Lead Img : ${article.leadImage.slice(0, 80)}...`);
      }
      console.log("");
    }

    summaries.push({
      channel: feed.name,
      total: items.length,
      fullText: channelSuccess,
    });
  }

  console.log("================================================================================");
  console.log("SUMMARY: FULL-TEXT READER EXTRACTION RESULTS");
  console.log("================================================================================");
  let grandTotal = 0;
  let grandFullText = 0;

  for (const s of summaries) {
    console.log(`${s.channel.padEnd(12)} : ${s.fullText}/${s.total}`);
    grandTotal += s.total;
    grandFullText += s.fullText;
  }
  console.log("--------------------------------------------------------------------------------");
  console.log(
    `TOTAL        : ${grandFullText}/${grandTotal} (${(
      (grandFullText / (grandTotal || 1)) *
      100
    ).toFixed(1)}%)`
  );
  console.log("================================================================================\n");
}

main().catch(console.error);
