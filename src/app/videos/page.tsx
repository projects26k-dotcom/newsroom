import { Metadata } from "next";
import { getAllVideos } from "@/lib/videos";
import { VideosClient } from "./VideosClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 600;

export const metadata: Metadata = {
  title: "Videos — Dispatch",
  description: "Browse latest news videos, prime-time bulletins, and field reports from top channels.",
};

export default async function VideosPage() {
  const { videos, channels } = await getAllVideos();

  return (
    <div className="py-2 sm:py-6">
      <VideosClient videos={videos} channels={channels} />
    </div>
  );
}
