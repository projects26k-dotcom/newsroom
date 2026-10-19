/**
 * Decode common HTML entities from titles
 */
export function decodeHtmlEntities(raw: string): string {
  if (!raw) return "";

  let text = raw;

  // Named entities
  const entities: Record<string, string> = {
    "&quot;": '"',
    "&amp;": "&",
    "&#39;": "'",
    "&apos;": "'",
    "&lt;": "<",
    "&gt;": ">",
    "&nbsp;": " ",
    "&ndash;": "–",
    "&mdash;": "—",
    "&hellip;": "…",
    "&lsquo;": "‘",
    "&rsquo;": "’",
    "&ldquo;": "“",
    "&rdquo;": "”",
  };

  for (const [entity, replacement] of Object.entries(entities)) {
    text = text.replaceAll(entity, replacement);
  }

  // Numeric decimal entities &#123;
  text = text.replace(/&#(\d+);/g, (_, code) => {
    try {
      return String.fromCharCode(parseInt(code, 10));
    } catch {
      return _;
    }
  });

  // Numeric hex entities &#x1a;
  text = text.replace(/&#x([0-9a-fA-F]+);/g, (_, code) => {
    try {
      return String.fromCharCode(parseInt(code, 16));
    } catch {
      return _;
    }
  });

  return text.trim();
}

/**
 * Clean domain for display (e.g. www.bbc.com -> bbc.com)
 */
export function cleanDomain(domain?: string | null): string {
  if (!domain) return "Source";
  return domain.replace(/^www\./i, "").toLowerCase();
}

/**
 * Get publisher domain from source name or URL
 */
export function getPublisherDomain(sourceName?: string | null, url?: string | null): string {
  if (url) {
    try {
      const u = new URL(url);
      if (!u.hostname.includes("news.google.com")) {
        return cleanDomain(u.hostname);
      }
    } catch {}
  }

  if (!sourceName) return "news.google.com";
  const lower = sourceName.toLowerCase();
  if (lower.includes("aaj tak") || lower.includes("aajtak")) return "aajtak.in";
  if (lower.includes("abp")) return "abplive.com";
  if (lower.includes("news24")) return "news24online.com";
  if (lower.includes("ndtv")) return "ndtv.com";
  if (lower.includes("bbc")) return "bbc.com";
  if (lower.includes("the hindu") || lower.includes("thehindu")) return "thehindu.com";
  if (lower.includes("hindustan times")) return "hindustantimes.com";
  if (lower.includes("times of india")) return "timesofindia.indiatimes.com";
  if (lower.includes("indian express")) return "indianexpress.com";
  if (lower.includes("economic times")) return "economictimes.indiatimes.com";
  if (lower.includes("livemint") || lower.includes("mint")) return "livemint.com";
  if (lower.includes("moneycontrol")) return "moneycontrol.com";
  if (lower.includes("indiatoday") || lower.includes("india today")) return "indiatoday.in";
  if (lower.includes("zee")) return "zeenews.india.com";
  if (lower.includes("jagran")) return "jagran.com";
  if (lower.includes("bhaskar")) return "bhaskar.com";
  if (lower.includes("amar ujala")) return "amarujala.com";
  if (lower.includes("reuters")) return "reuters.com";
  if (lower.includes("al jazeera")) return "aljazeera.com";
  if (lower.includes("cnn")) return "cnn.com";
  if (lower.includes("guardian")) return "theguardian.com";

  if (sourceName.includes(".")) {
    return cleanDomain(sourceName);
  }

  return `${sourceName.toLowerCase().replace(/[^a-z0-9]/g, "")}.com`;
}

/**
 * Get favicon URL for domain
 */
export function getFaviconUrl(domain?: string | null): string {
  if (!domain) return "";
  const cleaned = cleanDomain(domain);
  return `https://www.google.com/s2/favicons?domain=${cleaned}&sz=128`;
}


/**
 * Generate a deterministic rich editorial gradient pair based on string
 */
export function getGradientFromText(text: string): { from: string; to: string } {
  const gradients = [
    { from: "from-amber-700", to: "to-red-900" },
    { from: "from-stone-700", to: "to-stone-900" },
    { from: "from-blue-700", to: "to-slate-900" },
    { from: "from-emerald-700", to: "to-teal-950" },
    { from: "from-rose-700", to: "to-zinc-900" },
    { from: "from-indigo-700", to: "to-violet-950" },
    { from: "from-orange-700", to: "to-stone-900" },
    { from: "from-cyan-800", to: "to-slate-950" },
    { from: "from-red-800", to: "to-stone-900" },
    { from: "from-teal-800", to: "to-slate-950" },
  ];

  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % gradients.length;
  return gradients[index];
}
