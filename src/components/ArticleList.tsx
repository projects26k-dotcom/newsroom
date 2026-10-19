"use client";

import { useState } from "react";
import { Article } from "@/lib/news";
import { ArticleCard } from "./ArticleCard";
import { FeaturedArticle } from "./FeaturedArticle";
import { ChevronDown, RefreshCw } from "lucide-react";

interface ArticleListProps {
  articles: Article[];
  showFeatured?: boolean;
  initialBatchSize?: number;
  batchIncrement?: number;
}

export function ArticleList({
  articles,
  showFeatured = false,
  initialBatchSize = 24,
  batchIncrement = 24,
}: ArticleListProps) {
  const [visibleCount, setVisibleCount] = useState<number>(initialBatchSize);

  if (!articles || articles.length === 0) {
    return (
      <div className="text-center py-16 px-4 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900/50 shadow-xs max-w-xl mx-auto">
        <h3 className="font-serif text-2xl font-bold text-stone-900 dark:text-stone-100 mb-2">
          News temporarily unavailable, refresh in a minute
        </h3>
        <p className="text-sm text-stone-500 dark:text-stone-400 mb-6">
          No articles could be retrieved from the feed right now. Please refresh the page to check for updates.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-stone-200 text-white dark:text-stone-900 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>
    );
  }

  const visibleArticles = articles.slice(0, visibleCount);
  const hasMore = visibleCount < articles.length;
  const remainingCount = articles.length - visibleCount;

  const leadStory = showFeatured ? visibleArticles[0] : null;
  const gridStories = showFeatured ? visibleArticles.slice(1) : visibleArticles;

  const handleLoadMore = () => {
    setVisibleCount((prev) => Math.min(prev + batchIncrement, articles.length));
  };

  return (
    <div className="space-y-10">
      {/* Optional Lead Story */}
      {leadStory && <FeaturedArticle article={leadStory} />}

      {/* Article Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        {gridStories.map((article, index) => (
          <ArticleCard
            key={article.id || `${article.url}-${index}`}
            article={article}
          />
        ))}
      </div>

      {/* Load More Button (Client-side, no extra network requests) */}
      {hasMore && (
        <div className="pt-8 pb-4 flex flex-col items-center justify-center">
          <button
            type="button"
            onClick={handleLoadMore}
            className="group inline-flex items-center gap-2.5 px-8 py-3.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 hover:bg-stone-50 dark:hover:bg-stone-850 text-stone-900 dark:text-stone-100 font-medium text-sm transition-all duration-200 shadow-xs hover:shadow-md cursor-pointer hover:border-stone-400 dark:hover:border-stone-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
          >
            <span>Load more stories</span>
            <span className="text-xs font-mono text-stone-500 dark:text-stone-400">
              ({remainingCount} more)
            </span>
            <ChevronDown className="w-4 h-4 transition-transform group-hover:translate-y-0.5" />
          </button>
          <p className="mt-2 text-xs font-mono text-stone-400 dark:text-stone-500">
            Showing {visibleArticles.length} of {articles.length} dispatches
          </p>
        </div>
      )}
    </div>
  );
}
