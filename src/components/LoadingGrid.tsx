interface LoadingGridProps {
  count?: number;
  showFeatured?: boolean;
}

export function LoadingGrid({ count = 9, showFeatured = false }: LoadingGridProps) {
  return (
    <div className="w-full">
      {/* Featured Story Skeleton */}
      {showFeatured && (
        <div className="mb-10 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900/50 overflow-hidden grid grid-cols-1 lg:grid-cols-12 animate-pulse">
          <div className="lg:col-span-7 aspect-[16/10] lg:aspect-auto lg:min-h-[400px] bg-stone-200 dark:bg-stone-800" />
          <div className="lg:col-span-5 p-6 sm:p-10 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-stone-200 dark:bg-stone-800" />
                <div className="w-24 h-4 rounded bg-stone-200 dark:bg-stone-800" />
                <div className="w-16 h-4 rounded bg-stone-200 dark:bg-stone-800" />
              </div>
              <div className="w-full h-8 rounded bg-stone-200 dark:bg-stone-800" />
              <div className="w-4/5 h-8 rounded bg-stone-200 dark:bg-stone-800" />
              <div className="w-2/3 h-8 rounded bg-stone-200 dark:bg-stone-800" />
            </div>
            <div className="pt-6 border-t border-stone-100 dark:border-stone-800 flex justify-between">
              <div className="w-32 h-8 rounded-lg bg-stone-200 dark:bg-stone-800" />
              <div className="w-20 h-4 rounded bg-stone-200 dark:bg-stone-800" />
            </div>
          </div>
        </div>
      )}

      {/* Grid Skeletons */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900/50 overflow-hidden flex flex-col animate-pulse"
          >
            {/* Image Placeholder */}
            <div className="w-full aspect-[16/9] bg-stone-200 dark:bg-stone-800" />

            {/* Content Placeholder */}
            <div className="p-5 flex flex-col flex-1 justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-xs bg-stone-200 dark:bg-stone-800" />
                    <div className="w-20 h-3.5 rounded bg-stone-200 dark:bg-stone-800" />
                  </div>
                  <div className="w-12 h-3 rounded bg-stone-200 dark:bg-stone-800" />
                </div>
                <div className="w-full h-5 rounded bg-stone-200 dark:bg-stone-800" />
                <div className="w-5/6 h-5 rounded bg-stone-200 dark:bg-stone-800" />
                <div className="w-2/3 h-5 rounded bg-stone-200 dark:bg-stone-800" />
              </div>

              <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex justify-between">
                <div className="w-16 h-3 rounded bg-stone-200 dark:bg-stone-800" />
                <div className="w-12 h-3 rounded bg-stone-200 dark:bg-stone-800" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
