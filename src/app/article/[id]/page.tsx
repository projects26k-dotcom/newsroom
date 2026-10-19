import { Metadata } from "next";
import { notFound } from "next/navigation";
import { ExternalLink, Clock, User, ShieldAlert, Sparkles } from "lucide-react";
import { getArticleByUrl, decodeArticleId } from "@/lib/article";
import { BackButton } from "@/components/BackButton";
import { getGradientFromText } from "@/lib/utils";

export const revalidate = 3600;

interface ArticlePageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { id } = await params;
  const googleUrl = decodeArticleId(id);
  if (!googleUrl) {
    return { title: "Dispatch Reader" };
  }
  const article = await getArticleByUrl(googleUrl);
  return {
    title: `${article.title} — Dispatch`,
    description: article.excerpt || `Read ${article.title} in Reader Mode.`,
  };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { id } = await params;
  const googleUrl = decodeArticleId(id);

  if (!googleUrl) {
    notFound();
  }

  const article = await getArticleByUrl(googleUrl);
  const initial = (article.sourceName[0] || "D").toUpperCase();
  const gradient = getGradientFromText(article.sourceName || "Dispatch");

  return (
    <article className="min-h-screen py-6 sm:py-10 max-w-[760px] mx-auto px-4 sm:px-6">
      {/* Top Navigation & Action Row */}
      <div className="flex items-center justify-between gap-4 pb-6 border-b border-stone-200 dark:border-stone-800 mb-8">
        <BackButton />

        <div className="flex items-center gap-3">
          <span className="hidden sm:inline-block text-xs font-mono text-stone-500 dark:text-stone-400">
            Source: <strong className="text-stone-700 dark:text-stone-200">{article.sourceName}</strong>
          </span>

          <a
            href={article.publisherUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 hover:border-red-600 dark:hover:border-red-500 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 text-xs font-medium transition-colors shadow-xs"
          >
            <span>Read on original site</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Main Headline */}
      <header className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400 text-xs font-mono font-medium">
            <Sparkles className="w-3 h-3" />
            <span>Reader Mode</span>
          </span>
          <span className="text-xs font-mono text-stone-400 dark:text-stone-500">•</span>
          <span className="text-xs font-mono text-stone-500 dark:text-stone-400">{article.domain}</span>
        </div>

        <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-stone-900 dark:text-stone-50 leading-[1.2] sm:leading-[1.18] mb-5">
          {article.title}
        </h1>

        {/* Metadata Bar: Source Favicon + Byline + Date */}
        <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-stone-500 dark:text-stone-400 pt-3 border-t border-stone-100 dark:border-stone-850">
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://www.google.com/s2/favicons?domain=${article.domain}&sz=128`}
              alt={article.sourceName}
              className="w-4 h-4 rounded-xs object-contain"
            />
            <span className="font-semibold text-stone-800 dark:text-stone-200">
              {article.sourceName}
            </span>
          </div>

          {article.byline && (
            <div className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-stone-400" />
              <span>{article.byline}</span>
            </div>
          )}

          {article.publishDate && (
            <div className="flex items-center gap-1.5 font-mono text-[11px]">
              <Clock className="w-3.5 h-3.5 text-stone-400" />
              <span>{article.publishDate}</span>
            </div>
          )}
        </div>
      </header>

      {/* Hero Lead Image */}
      {article.leadImage ? (
        <div className="mb-10 rounded-2xl overflow-hidden border border-stone-200/80 dark:border-stone-800 bg-stone-100 dark:bg-stone-900 shadow-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={article.leadImage}
            alt={article.title}
            referrerPolicy="no-referrer"
            className="w-full aspect-[16/9] object-cover"
          />
        </div>
      ) : (
        <div className="mb-10 rounded-2xl overflow-hidden aspect-[16/7] relative bg-gradient-to-br from-stone-800 to-stone-900 flex flex-col items-center justify-center p-6 border border-stone-200/80 dark:border-stone-800 shadow-sm">
          <div className="w-14 h-14 rounded-full border border-white/25 bg-white/10 backdrop-blur-xs flex items-center justify-center text-white font-serif font-black text-2xl shadow-inner">
            {initial}
          </div>
          <span className="mt-2 text-xs font-mono tracking-widest uppercase text-white/80 font-medium">
            {article.sourceName}
          </span>
        </div>
      )}

      {/* Article Body (720px max, 18px font, 1.7 line height, Hindi rendering) */}
      <main className="max-w-[720px] mx-auto">
        {!article.isFallback && article.contentHtml ? (
          <div
            className="reader-content font-serif sm:font-sans selection:bg-red-700 selection:text-white"
            dangerouslySetInnerHTML={{ __html: article.contentHtml }}
          />
        ) : (
          /* Fallback Section (if full text isn't available or under 300 chars) */
          <div className="my-8 p-6 sm:p-10 rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-900/40 text-center space-y-6">
            <div className="w-12 h-12 mx-auto rounded-full bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 flex items-center justify-center">
              <ShieldAlert className="w-6 h-6" />
            </div>

            <div className="space-y-2">
              <h2 className="font-serif text-2xl font-bold text-stone-900 dark:text-stone-100">
                Full text isn&apos;t available here
              </h2>
              <p className="text-sm text-stone-600 dark:text-stone-400 max-w-md mx-auto leading-relaxed">
                {article.fallbackReason ||
                  "The publisher restricts full-text syndication or requires direct browser rendering."}
              </p>
            </div>

            {article.excerpt && (
              <blockquote className="text-left max-w-lg mx-auto p-4 rounded-xl border-l-4 border-red-600 bg-white dark:bg-stone-850 text-stone-700 dark:text-stone-300 text-sm leading-relaxed italic shadow-xs">
                &ldquo;{article.excerpt}&rdquo;
              </blockquote>
            )}

            <div className="pt-2">
              <a
                href={article.publisherUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 px-6 py-3 rounded-xl bg-stone-900 dark:bg-stone-100 hover:bg-red-700 dark:hover:bg-red-600 text-white dark:text-stone-900 dark:hover:text-white font-medium text-sm transition-all shadow-md cursor-pointer"
              >
                <span>Read on original site</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Footer Action Bar */}
      <footer className="mt-14 pt-8 border-t border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500 dark:text-stone-400">
        <div>
          <span>Source: </span>
          <strong className="text-stone-800 dark:text-stone-200">{article.sourceName}</strong>
          <span className="mx-2">•</span>
          <span className="font-mono">{article.domain}</span>
        </div>

        <a
          href={article.publisherUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-stone-300 dark:border-stone-700 hover:border-red-600 dark:hover:border-red-500 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 text-xs font-semibold uppercase tracking-wider transition-colors shadow-xs"
        >
          <span>Read on original site</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </footer>
    </article>
  );
}
