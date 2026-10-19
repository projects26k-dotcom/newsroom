import { LoadingGrid } from "@/components/LoadingGrid";

export default function Loading() {
  return (
    <div className="space-y-12 py-4">
      <LoadingGrid count={6} showFeatured={true} />
    </div>
  );
}
