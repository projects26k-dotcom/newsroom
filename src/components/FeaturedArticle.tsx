import Link from "next/link";
import { Clock, BookOpen, Flame, Layers, Play } from "lucide-react";
import { Article } from "@/lib/news";
import { ArticleThumbnail } from "./ArticleThumbnail";

interface FeaturedArticleProps {
  article: Article;
}

export function FeaturedArticle({ article }: FeaturedArticleProps) {
  const articleHref = `/article/${article.articleId}`;

  return (
    <section className="relative mb-10 overflow-hidden rounded-2xl border border-stone-200/90 dark:border-stone-800 bg-white dark:bg-stone-900/60 shadow-xs hover:border-stone-400 dark:hover:border-stone-700 transition-all duration-300 group">
      <div className="grid grid-cols-1 lg:grid-cols-12 rounded-2xl">
        {/* Featured Visual Thumbnail - 7 cols on large screens */}
        <Link
          href={articleHref}
          prefetch={false}
          className="relative lg:col-span-7 aspect-[16/10] lg:aspect-auto lg:min-h-[380px] overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-red-600 block"
        >
          <ArticleThumbnail
            articleUrl={article.url}
            source={article.source}
            immediate={true}
            aspectClass="aspect-[16/10] lg:aspect-auto lg:min-h-[380px] h-full"
          />

          {/* Lead Story Badge */}
          <div className="absolute top-4 left-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-700 text-white text-xs font-semibold tracking-wider uppercase shadow-md z-20">
            <Flame className="w-3.5 h-3.5 fill-white" />
            <span>Lead Story</span>
          </div>

          {/* Video Badge */}
          {article.hasVideo && (
            <div className="absolute bottom-4 left-4 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-black/80 backdrop-blur-xs text-white text-xs font-semibold shadow-md z-20 border border-white/10">
              <Play className="w-3 h-3 fill-red-500 text-red-500" />
              <span>Video Story</span>
            </div>
          )}
        </Link>

        {/* Content Side - 5 cols on large screens */}
        <div className="flex flex-col justify-between p-6 sm:p-8 lg:p-10 lg:col-span-5">
          <div>
            {/* Source & Timestamp */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-stone-500 dark:text-stone-400 mb-4">
              <span className="font-bold text-stone-900 dark:text-stone-100 text-sm">
                {article.source}
              </span>

              {article.language === "hi" && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400">
                  हिन्दी
                </span>
              )}

              <div className="flex items-center gap-1 text-stone-400 dark:text-stone-500 font-mono text-xs">
                <Clock className="w-3.5 h-3.5" />
                <span>{article.timeAgo}</span>
              </div>
            </div>

            {/* Headline */}
            <h1 className="font-serif text-2xl sm:text-3xl lg:text-3xl xl:text-4xl font-bold tracking-tight text-stone-900 dark:text-stone-50 leading-tight sm:leading-snug">
              <Link
                href={articleHref}
                prefetch={false}
                className="hover:text-red-700 dark:hover:text-red-400 transition-colors"
              >
                {article.title}
              </Link>
            </h1>

            {/* More Coverage under lead story if present */}
            {article.related && article.related.length > 0 && (
              <div className="mt-6 pt-4 border-t border-stone-100 dark:border-stone-800">
                <div className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Layers className="w-3 h-3 text-red-600 dark:text-red-400" />
                  <span>More coverage</span>
                </div>
                <ul className="space-y-1.5">
                  {article.related.map((rel, idx) => (
                    <li key={idx} className="text-xs">
                      <Link
                        href={`/article/${rel.articleId}`}
                        prefetch={false}
                        className="flex items-baseline justify-between gap-2 text-stone-700 dark:text-stone-300 hover:text-red-700 dark:hover:text-red-400 transition-colors"
                      >
                        <span className="line-clamp-1">{rel.title}</span>
                        <span className="shrink-0 text-[10px] font-mono text-stone-400 bg-stone-100 dark:bg-stone-800 px-1.5 py-0.5 rounded">
                          {rel.source}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Call to Action Button */}
          <div className="mt-8 pt-6 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
            <Link
              href={articleHref}
              prefetch={false}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 text-xs font-semibold tracking-wide uppercase hover:bg-red-700 dark:hover:bg-red-600 dark:hover:text-white transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Read in Newsroom</span>
            </Link>

            <span className="text-xs text-stone-400 dark:text-stone-500 font-mono">
              Reader Mode
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
