import { GoogleDecoder } from "google-news-url-decoder";

const CHROME_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36";

/**
 * Try 1: fetch the link with redirect: "follow" and desktop Chrome User-Agent.
 * If final URL is not on news.google.com, use it.
 */
async function tryDirectFollow(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: AbortSignal.timeout(4000),
      headers: {
        "User-Agent": CHROME_UA,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });

    if (res.url && !res.url.includes("news.google.com")) {
      return res.url;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Try 2: If the article id is the old base64 format, base64url-decode it and extract embedded http(s) URL.
 */
function tryOldBase64(url: string): string | null {
  try {
    const match = url.match(/articles\/([A-Za-z0-9_-]+)/);
    if (!match) return null;
    const id = match[1];

    const base64 = id.replace(/-/g, "+").replace(/_/g, "/");
    const pad = base64.length % 4;
    const padded = pad ? base64 + "=".repeat(4 - pad) : base64;
    const buf = Buffer.from(padded, "base64");
    const str = buf.toString("latin1");

    const httpsIndex = str.indexOf("https://");
    const httpIndex = str.indexOf("http://");
    const startIndex = httpsIndex !== -1 ? httpsIndex : httpIndex;
    if (startIndex === -1) return null;

    const sub = str.slice(startIndex);
    const urlMatch = sub.match(/^https?:\/\/[^\s\x00-\x1f\x7f-\xff"<>]+/);
    if (urlMatch && !urlMatch[0].includes("news.google.com")) {
      return urlMatch[0];
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Try 3: Open https://news.google.com/rss/articles/<id>, read data-n-a-sg and data-n-a-ts,
 * then POST to https://news.google.com/_/DotsSplashUi/data/batchexecute using "Fbv4je" request.
 */
async function tryBatchExecute(url: string): Promise<string | null> {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split("/").filter(Boolean);
    const base64Str = pathParts[pathParts.length - 1];
    if (!base64Str) return null;

    const rssPageUrl = `https://news.google.com/rss/articles/${base64Str}`;
    const pageRes = await fetch(rssPageUrl, {
      signal: AbortSignal.timeout(4000),
      headers: {
        "User-Agent": CHROME_UA,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });

    if (!pageRes.ok) return null;
    const html = await pageRes.text();

    const sgMatch = html.match(/data-n-a-sg="([^"]+)"/);
    const tsMatch = html.match(/data-n-a-ts="([^"]+)"/);
    if (!sgMatch || !tsMatch) return null;

    const signature = sgMatch[1];
    const timestamp = tsMatch[1];

    const batchUrl = "https://news.google.com/_/DotsSplashUi/data/batchexecute";
    const payload = [
      "Fbv4je",
      `["garturlreq",[["X","X",["X","X"],null,null,1,1,"US:en",null,1,null,null,null,null,null,0,1],"X","X",1,[1,1,1],1,1,null,0,0,null,0],"${base64Str}",${timestamp},"${signature}"]`,
    ];
    const reqData = `f.req=${encodeURIComponent(JSON.stringify([[payload]]))}`;

    const batchRes = await fetch(batchUrl, {
      method: "POST",
      signal: AbortSignal.timeout(4000),
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        "User-Agent": CHROME_UA,
        Origin: "https://news.google.com",
        Referer: "https://news.google.com/",
      },
      body: reqData,
    });

    if (!batchRes.ok) return null;

    const text = await batchRes.text();
    const splitParts = text.split("\n\n");
    if (splitParts.length < 2) return null;

    const parsedData = JSON.parse(splitParts[1]);
    const batchResponses = parsedData.filter(
      (d: any) => (d[0] === "wrb.fr" || d[0] === "w779db") && d[1] === "Fbv4je"
    );

    if (batchResponses.length > 0) {
      const innerData = JSON.parse(batchResponses[0][2]);
      return innerData[1] || null;
    }

    if (parsedData[0] && parsedData[0][2]) {
      const innerData = JSON.parse(parsedData[0][2]);
      return innerData[1] || null;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Fallback to GoogleDecoder with 4s timeout
 */
async function tryGoogleDecoder(url: string): Promise<string | null> {
  try {
    const decoder = new GoogleDecoder();
    const res = await Promise.race([
      decoder.decode(url),
      new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error("Timeout")), 4000)
      ),
    ]);

    if (res && res.status && res.decoded_url) {
      return res.decoded_url;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Resolve Google News redirect URL to original publisher URL.
 * Never throws, returns null on failure.
 */
export async function resolveGoogleNewsUrl(url: string): Promise<string | null> {
  if (!url) return null;
  if (!url.includes("news.google.com")) return url;

  // Try 1: Direct fetch with redirect follow
  const url1 = await tryDirectFollow(url);
  if (url1) return url1;

  // Try 2: Old base64 decoding format
  const url2 = tryOldBase64(url);
  if (url2) return url2;

  // Try 3: batchexecute Fbv4je resolution
  const url3 = await tryBatchExecute(url);
  if (url3) return url3;

  // Try 3b: GoogleDecoder fallback
  const url4 = await tryGoogleDecoder(url);
  if (url4) return url4;

  return null;
}
