import { Metadata } from "next";
import { searchNews } from "@/lib/news";
import { SearchBar } from "@/components/SearchBar";
import { ArticleList } from "@/components/ArticleList";
import { ErrorNotice } from "@/components/ErrorNotice";
import { Newspaper } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 300;

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const { q } = await searchParams;
  if (!q) {
    return {
      title: "Search Dispatches — Dispatch",
      description: "Search live headlines and dispatches across Google News RSS.",
    };
  }
  return {
    title: `Search: "${q}" — Dispatch`,
    description: `News dispatches for query "${q}" via Google News RSS.`,
  };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q } = await searchParams;
  const query = q?.trim() || "";

  const shouldSearch = query.length > 0;
  const { articles, error } = shouldSearch
    ? await searchNews(query)
    : { articles: [], error: null };

  return (
    <div className="space-y-8">
      {/* Search Header */}
      <div className="text-center max-w-2xl mx-auto pt-2 pb-4">
        <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-stone-900 dark:text-stone-50 mb-2">
          Dispatch Search
        </h1>
        <p className="text-stone-500 dark:text-stone-400 text-sm sm:text-base">
          Query Google News RSS index for breaking headlines and regional reporting.
        </p>
      </div>

      {/* Interactive Search Bar */}
      <SearchBar initialQuery={query} />

      {/* Query Results / Empty State */}
      {!shouldSearch ? (
        <div className="text-center py-16 px-4 rounded-2xl border border-dashed border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/20 max-w-2xl mx-auto">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-400">
            <Newspaper className="w-6 h-6" />
          </div>
          <h2 className="font-serif text-lg font-semibold text-stone-800 dark:text-stone-200 mb-1">
            Search live dispatches
          </h2>
          <p className="text-sm text-stone-500 dark:text-stone-400 max-w-md mx-auto">
            Type keywords above to discover breaking developments and coverage from leading newsrooms.
          </p>
        </div>
      ) : error ? (
        <div className="py-8">
          <ErrorNotice message={error} />
        </div>
      ) : articles.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900/40 max-w-xl mx-auto">
          <h2 className="font-serif text-xl font-bold text-stone-900 dark:text-stone-100 mb-2">
            No dispatches matching &ldquo;{query}&rdquo;
          </h2>
          <p className="text-sm text-stone-500 dark:text-stone-400 leading-relaxed">
            Try adjusting your search query, using broader keywords, or checking one of the section desks above.
          </p>
        </div>
      ) : (
        <section aria-labelledby="search-results-heading" className="space-y-6">
          <div className="flex items-baseline justify-between border-b-2 border-stone-900 dark:border-stone-100 pb-3">
            <div className="flex items-center gap-3">
              <h2
                id="search-results-heading"
                className="font-serif text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-50"
              >
                Results for &ldquo;{query}&rdquo;
              </h2>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-850 text-stone-600 dark:text-stone-400">
                {articles.length} dispatches
              </span>
            </div>

            <span className="text-xs font-mono text-stone-400 dark:text-stone-500">
              Live Wire
            </span>
          </div>

          <ArticleList articles={articles} initialBatchSize={24} batchIncrement={24} />
        </section>
      )}
    </div>
  );
}
