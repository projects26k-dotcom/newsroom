import { Metadata } from "next";
import { getNews } from "@/lib/news";
import { FEEDS } from "@/lib/feeds";
import { ArticleList } from "@/components/ArticleList";
import { ErrorNotice } from "@/components/ErrorNotice";

export const dynamic = "force-dynamic";
export const revalidate = 300;

export const metadata: Metadata = {
  title: "India — Dispatch",
  description: "Top national headlines and breaking dispatches across India via Google News RSS.",
};

export default async function HomePage() {
  const indiaFeed = FEEDS.find((f) => f.id === "india") || FEEDS[0];
  const { articles, error } = await getNews([indiaFeed]);

  if (error || !articles || articles.length === 0) {
    return (
      <div className="py-12">
        <ErrorNotice message={error || "News temporarily unavailable, refresh in a minute"} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Front Page Header */}
      <div className="flex items-baseline justify-between border-b-2 border-stone-900 dark:border-stone-100 pb-3">
        <div className="flex items-center gap-3">
          <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-50">
            India Top Stories
          </h1>
          <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-850 text-stone-600 dark:text-stone-400">
            {articles.length} dispatches
          </span>
        </div>

        <span className="text-xs font-mono uppercase tracking-widest text-stone-400 dark:text-stone-500">
          Live Wire • 5m Cache
        </span>
      </div>

      {/* 24 articles first + client-side load more */}
      <ArticleList articles={articles} showFeatured={true} initialBatchSize={24} batchIncrement={24} />
    </div>
  );
}
