import { LoadingGrid } from "@/components/LoadingGrid";

export default function CategoryLoading() {
  return (
    <div className="space-y-10 py-2">
      {/* Header Skeleton */}
      <div className="border-b-2 border-stone-900 dark:border-stone-100 pb-6 animate-pulse">
        <div className="w-24 h-3.5 bg-stone-200 dark:bg-stone-800 rounded mb-2" />
        <div className="w-64 h-10 bg-stone-200 dark:bg-stone-800 rounded mb-3" />
        <div className="w-96 h-4 bg-stone-200 dark:bg-stone-800 rounded" />
      </div>

      <LoadingGrid count={6} showFeatured={true} />
    </div>
  );
}
