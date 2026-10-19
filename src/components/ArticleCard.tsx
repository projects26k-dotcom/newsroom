import Link from "next/link";
import { Clock, BookOpen, Layers } from "lucide-react";
import { Article } from "@/lib/news";
import { ArticleThumbnail } from "./ArticleThumbnail";

interface ArticleCardProps {
  article: Article;
  featured?: boolean;
}

export function ArticleCard({ article, featured = false }: ArticleCardProps) {
  const articleHref = `/article/${article.articleId}`;

  return (
    <article
      className={`group flex flex-col h-full bg-white dark:bg-stone-900/70 rounded-xl border border-stone-200/90 dark:border-stone-800/80 overflow-hidden hover:border-stone-400 dark:hover:border-stone-700 transition-all duration-300 hover:shadow-lg dark:hover:shadow-stone-950/40 ${
        featured ? "lg:col-span-2" : ""
      }`}
    >
      {/* Top Banner: Article thumbnail linking to reader mode */}
      <Link
        href={articleHref}
        prefetch={false}
        className="block relative w-full overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-red-600 select-none"
      >
        <ArticleThumbnail
          articleUrl={article.url}
          source={article.source}
          immediate={false}
          aspectClass="aspect-[16/9]"
        />

        {/* Reader Mode hint pill */}
        <div className="absolute top-3 right-3 p-1.5 rounded-full bg-black/50 backdrop-blur-xs text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-sm z-20">
          <BookOpen className="w-3.5 h-3.5" />
        </div>
      </Link>

      {/* Card Content */}
      <div className="flex flex-col flex-1 p-5 justify-between">
        <div>
          {/* Metadata Row: Source & Time */}
          <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 mb-2.5 gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="font-semibold text-stone-800 dark:text-stone-200 truncate">
                {article.source}
              </span>
              {article.language === "hi" && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400">
                  हिन्दी
                </span>
              )}
            </div>

            <div className="flex items-center gap-1 shrink-0 text-stone-400 dark:text-stone-500 font-mono text-[11px]">
              <Clock className="w-3 h-3" />
              <span>{article.timeAgo}</span>
            </div>
          </div>

          {/* Main Headline */}
          <h2 className="font-serif text-lg sm:text-xl font-bold leading-snug tracking-tight text-stone-900 dark:text-stone-100 transition-colors">
            <Link
              href={articleHref}
              prefetch={false}
              className="hover:text-red-700 dark:hover:text-red-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-600 rounded"
            >
              {article.title}
            </Link>
          </h2>
        </div>

        {/* More Coverage list (opens in Reader Mode on Dispatch) */}
        {article.related && article.related.length > 0 && (
          <div className="mt-4 pt-3.5 border-t border-stone-100 dark:border-stone-800/80">
            <div className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Layers className="w-3 h-3 text-red-600 dark:text-red-400" />
              <span>More coverage</span>
              <span className="text-[10px] text-stone-400 font-mono font-normal">
                ({article.related.length})
              </span>
            </div>

            <ul className="space-y-2">
              {article.related.map((rel, idx) => (
                <li key={idx} className="text-xs">
                  <Link
                    href={`/article/${rel.articleId}`}
                    prefetch={false}
                    className="group/rel flex items-baseline justify-between gap-2 text-stone-700 dark:text-stone-300 hover:text-red-700 dark:hover:text-red-400 transition-colors"
                  >
                    <span className="line-clamp-2 leading-relaxed">
                      {rel.title}
                    </span>
                    <span className="shrink-0 text-[10px] font-mono text-stone-400 dark:text-stone-500 bg-stone-100 dark:bg-stone-800/80 px-1.5 py-0.5 rounded">
                      {rel.source}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Reader Mode link */}
        <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800/80 flex items-center justify-between text-xs">
          <Link
            href={articleHref}
            prefetch={false}
            className="text-[11px] font-sans font-medium text-stone-500 dark:text-stone-400 hover:text-red-700 dark:hover:text-red-400 transition-colors inline-flex items-center gap-1.5"
          >
            <BookOpen className="w-3 h-3" />
            <span>Read dispatch</span>
          </Link>

          <span className="text-[10px] font-mono text-stone-400 dark:text-stone-500">
            Reader Mode
          </span>
        </div>
      </div>
    </article>
  );
}
