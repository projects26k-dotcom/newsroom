export interface FeedConfig {
  id: string;
  name: string;
  url: string;
  category: string;
  language: "en" | "hi";
  channel?: string;
  domain?: string;
  tagline?: string;
}

export const CATEGORY_TABS = [
  { id: "india", name: "India", href: "/" },
  { id: "hindi", name: "Hindi", href: "/category/hindi" },
  { id: "live", name: "Live", href: "/live", isLive: true },
  { id: "videos", name: "Videos", href: "/videos" },
  { id: "world", name: "World", href: "/category/world" },
  { id: "business", name: "Business", href: "/category/business" },
  { id: "technology", name: "Technology", href: "/category/technology" },
  { id: "sports", name: "Sports", href: "/category/sports" },
  { id: "entertainment", name: "Entertainment", href: "/category/entertainment" },
  { id: "science", name: "Science", href: "/category/science" },
  { id: "health", name: "Health", href: "/category/health" },
];

export const SOURCE_FILTERS = [
  { id: "aajtak", name: "Aaj Tak", domain: "aajtak.in", language: "hi" as const },
  { id: "abp", name: "ABP", domain: "abplive.com", language: "hi" as const },
  { id: "news24", name: "News24", domain: "news24online.com", language: "hi" as const },
  { id: "ndtv", name: "NDTV", domain: "ndtv.com", language: "en" as const },
  { id: "bbc", name: "BBC", domain: "bbc.com", language: "en" as const },
  { id: "thehindu", name: "The Hindu", domain: "thehindu.com", language: "en" as const },
];

// Editable array of { name, url, category, language }
export const FEEDS: FeedConfig[] = [
  // Primary Categories
  {
    id: "india",
    name: "India",
    url: "https://news.google.com/rss?hl=en-IN&gl=IN&ceid=IN:en",
    category: "india",
    language: "en",
    tagline: "Top national headlines and breaking stories across India",
  },
  {
    id: "hindi",
    name: "Hindi",
    url: "https://news.google.com/rss?hl=hi&gl=IN&ceid=IN:hi",
    category: "hindi",
    language: "hi",
    tagline: "देश और दुनिया की ताज़ा ख़बरें और मुख्य समाचार",
  },
  {
    id: "world",
    name: "World",
    url: "https://news.google.com/rss/headlines/section/topic/WORLD?hl=en-IN&gl=IN&ceid=IN:en",
    category: "world",
    language: "en",
    tagline: "International affairs, geopolitical developments, and global coverage",
  },
  {
    id: "business",
    name: "Business",
    url: "https://news.google.com/rss/headlines/section/topic/BUSINESS?hl=en-IN&gl=IN&ceid=IN:en",
    category: "business",
    language: "en",
    tagline: "Financial markets, macroeconomic shifts, and corporate enterprise",
  },
  {
    id: "technology",
    name: "Technology",
    url: "https://news.google.com/rss/headlines/section/topic/TECHNOLOGY?hl=en-IN&gl=IN&ceid=IN:en",
    category: "technology",
    language: "en",
    tagline: "Computing, artificial intelligence frontiers, and digital innovation",
  },
  {
    id: "sports",
    name: "Sports",
    url: "https://news.google.com/rss/headlines/section/topic/SPORTS?hl=en-IN&gl=IN&ceid=IN:en",
    category: "sports",
    language: "en",
    tagline: "Tournament stories, athletics, cricket, and championship coverage",
  },
  {
    id: "entertainment",
    name: "Entertainment",
    url: "https://news.google.com/rss/headlines/section/topic/ENTERTAINMENT?hl=en-IN&gl=IN&ceid=IN:en",
    category: "entertainment",
    language: "en",
    tagline: "Cinema, performing arts, releases, and cultural review",
  },
  {
    id: "science",
    name: "Science",
    url: "https://news.google.com/rss/headlines/section/topic/SCIENCE?hl=en-IN&gl=IN&ceid=IN:en",
    category: "science",
    language: "en",
    tagline: "Space exploration, empirical discovery, and cosmos research",
  },
  {
    id: "health",
    name: "Health",
    url: "https://news.google.com/rss/headlines/section/topic/HEALTH?hl=en-IN&gl=IN&ceid=IN:en",
    category: "health",
    language: "en",
    tagline: "Clinical developments, medical policy, and healthcare research",
  },

  // Per Channel Feeds
  {
    id: "aajtak",
    name: "Aaj Tak",
    url: "https://news.google.com/rss/search?q=site:aajtak.in+when:1d&hl=hi&gl=IN&ceid=IN:hi",
    category: "channel",
    channel: "aajtak",
    domain: "aajtak.in",
    language: "hi",
    tagline: "आज तक — ताज़ा समाचार और लाइव अपडेट्स",
  },
  {
    id: "abp",
    name: "ABP",
    url: "https://news.google.com/rss/search?q=site:abplive.com+when:1d&hl=hi&gl=IN&ceid=IN:hi",
    category: "channel",
    channel: "abp",
    domain: "abplive.com",
    language: "hi",
    tagline: "एबीपी न्यूज़ — मुख्य समाचार और विश्लेषण",
  },
  {
    id: "news24",
    name: "News24",
    url: "https://news.google.com/rss/search?q=site:news24online.com+when:1d&hl=hi&gl=IN&ceid=IN:hi",
    category: "channel",
    channel: "news24",
    domain: "news24online.com",
    language: "hi",
    tagline: "न्यूज़24 — देश-दुनिया की ख़ास ख़बरें",
  },
  {
    id: "ndtv",
    name: "NDTV",
    url: "https://news.google.com/rss/search?q=site:ndtv.com+when:1d&hl=hi&gl=IN&ceid=IN:hi",
    category: "channel",
    channel: "ndtv",
    domain: "ndtv.com",
    language: "en",
    tagline: "NDTV — Breaking news and comprehensive reporting",
  },
  {
    id: "bbc",
    name: "BBC",
    url: "https://news.google.com/rss/search?q=site:bbc.com+when:1d&hl=hi&gl=IN&ceid=IN:hi",
    category: "channel",
    channel: "bbc",
    domain: "bbc.com",
    language: "en",
    tagline: "BBC News — Global perspective and comprehensive stories",
  },
  {
    id: "thehindu",
    name: "The Hindu",
    url: "https://news.google.com/rss/search?q=site:thehindu.com+when:1d&hl=hi&gl=IN&ceid=IN:hi",
    category: "channel",
    channel: "thehindu",
    domain: "thehindu.com",
    language: "en",
    tagline: "The Hindu — In-depth national journalism and editorial analysis",
  },
];

export function getFeedsForCategory(categoryOrSlug: string): FeedConfig[] {
  const normalized = categoryOrSlug.toLowerCase().trim();

  // If matching channel
  const channelFeed = FEEDS.find(
    (f) => f.channel === normalized || f.id === normalized
  );
  if (channelFeed) {
    return [channelFeed];
  }

  // If matching category
  const categoryFeeds = FEEDS.filter((f) => f.category === normalized);
  if (categoryFeeds.length > 0) {
    return categoryFeeds;
  }

  // Default to India top stories
  return [FEEDS[0]];
}

export function getFeedById(id: string): FeedConfig | undefined {
  return FEEDS.find((f) => f.id === id.toLowerCase());
}

export function getSourceFilterById(id: string) {
  return SOURCE_FILTERS.find((s) => s.id === id.toLowerCase());
}
