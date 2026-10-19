import { LoadingGrid } from "@/components/LoadingGrid";

export default function SearchLoading() {
  return (
    <div className="space-y-8 py-4">
      {/* Header Skeleton */}
      <div className="text-center max-w-2xl mx-auto space-y-2 animate-pulse">
        <div className="w-48 h-8 bg-stone-200 dark:bg-stone-800 rounded mx-auto" />
        <div className="w-80 h-4 bg-stone-200 dark:bg-stone-800 rounded mx-auto" />
      </div>

      {/* Search Input Skeleton */}
      <div className="w-full max-w-3xl mx-auto h-14 bg-stone-200 dark:bg-stone-800 rounded-xl animate-pulse" />

      {/* Grid */}
      <LoadingGrid count={6} showFeatured={false} />
    </div>
  );
}
