export default function ArticleLoading() {
  return (
    <div className="min-h-screen py-6 sm:py-10 max-w-[760px] mx-auto px-4 sm:px-6 animate-pulse">
      {/* Top Bar Skeleton */}
      <div className="flex items-center justify-between pb-6 border-b border-stone-200 dark:border-stone-800 mb-8">
        <div className="w-16 h-8 rounded-lg bg-stone-200 dark:bg-stone-800" />
        <div className="w-36 h-8 rounded-lg bg-stone-200 dark:bg-stone-800" />
      </div>

      {/* Header Skeleton */}
      <div className="space-y-4 mb-8">
        <div className="w-24 h-4 rounded-full bg-stone-200 dark:bg-stone-800" />
        <div className="w-full h-10 rounded-lg bg-stone-200 dark:bg-stone-800" />
        <div className="w-4/5 h-10 rounded-lg bg-stone-200 dark:bg-stone-800" />
        <div className="flex items-center gap-4 pt-4 border-t border-stone-100 dark:border-stone-850">
          <div className="w-24 h-4 rounded bg-stone-200 dark:bg-stone-800" />
          <div className="w-32 h-4 rounded bg-stone-200 dark:bg-stone-800" />
        </div>
      </div>

      {/* Hero Image Skeleton */}
      <div className="w-full aspect-[16/9] rounded-2xl bg-stone-200 dark:bg-stone-800 mb-10" />

      {/* Body Lines Skeleton */}
      <div className="max-w-[720px] mx-auto space-y-4">
        <div className="w-full h-4 rounded bg-stone-200 dark:bg-stone-800" />
        <div className="w-full h-4 rounded bg-stone-200 dark:bg-stone-800" />
        <div className="w-11/12 h-4 rounded bg-stone-200 dark:bg-stone-800" />
        <div className="w-full h-4 rounded bg-stone-200 dark:bg-stone-800" />
        <div className="w-3/4 h-4 rounded bg-stone-200 dark:bg-stone-800 mb-6" />

        <div className="w-full h-4 rounded bg-stone-200 dark:bg-stone-800" />
        <div className="w-full h-4 rounded bg-stone-200 dark:bg-stone-800" />
        <div className="w-5/6 h-4 rounded bg-stone-200 dark:bg-stone-800" />
      </div>
    </div>
  );
}
