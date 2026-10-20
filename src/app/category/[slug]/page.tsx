import { notFound } from "next/navigation";
import { Metadata } from "next";
import { getNews } from "@/lib/news";
import { FEEDS, getFeedById, CATEGORY_TABS } from "@/lib/feeds";
import { ArticleList } from "@/components/ArticleList";
import { ErrorNotice } from "@/components/ErrorNotice";

export const dynamic = "force-dynamic";
export const revalidate = 300;

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const feed = getFeedById(slug);

  if (!feed) {
    return {
      title: "Section Not Found — Newsroom",
    };
  }

  return {
    title: `${feed.name} — Newsroom`,
    description: feed.tagline || `Latest ${feed.name} news and updates via Google News RSS.`,
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const feed = getFeedById(slug);

  if (!feed) {
    notFound();
  }

  const { articles, error } = await getNews([feed]);

  return (
    <div className="space-y-8">
      {/* Category Editorial Masthead */}
      <header className="border-b-2 border-stone-900 dark:border-stone-100 pb-5">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase tracking-widest text-red-700 dark:text-red-400 font-semibold">
                Desk
              </span>
              {feed.language === "hi" && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400">
                  हिन्दी संस्करण
                </span>
              )}
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-stone-900 dark:text-stone-50 mt-1">
              {feed.name}
            </h1>
            {feed.tagline && (
              <p className="text-sm sm:text-base text-stone-600 dark:text-stone-400 mt-2 max-w-2xl font-serif italic">
                {feed.tagline}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-stone-500 dark:text-stone-400">
            <span className="px-2.5 py-1 rounded-full bg-stone-100 dark:bg-stone-850">
              {articles.length} stories
            </span>
          </div>
        </div>
      </header>

      {/* Content Rendering */}
      {error || articles.length === 0 ? (
        <div className="py-8">
          <ErrorNotice message={error || "News temporarily unavailable, refresh in a minute"} />
        </div>
      ) : (
        <ArticleList articles={articles} showFeatured={true} initialBatchSize={24} batchIncrement={24} />
      )}
    </div>
  );
}
