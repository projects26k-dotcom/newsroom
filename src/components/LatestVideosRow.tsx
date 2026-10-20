"use client";

import { useState } from "react";
import Link from "next/link";
import { Video, ArrowRight, ChevronRight, ChevronLeft } from "lucide-react";
import { VideoItem } from "@/lib/videos";
import { VideoCard } from "./VideoCard";
import { VideoModal } from "./VideoModal";

interface LatestVideosRowProps {
  videos: VideoItem[];
}

export function LatestVideosRow({ videos }: LatestVideosRowProps) {
  const [activeVideo, setActiveVideo] = useState<VideoItem | null>(null);

  if (!videos || videos.length === 0) return null;

  return (
    <section className="my-10 pt-8 border-t-2 border-stone-900 dark:border-stone-100">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400">
            <Video className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-50">
              Latest Video Dispatches
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Fresh bulletins and reports from leading national and international desks
            </p>
          </div>
        </div>

        <Link
          href="/videos"
          prefetch={false}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-700 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition-colors uppercase tracking-wider group"
        >
          <span>See all</span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>

      {/* Horizontal Scroll Row */}
      <div className="relative">
        <div className="flex items-stretch gap-4 sm:gap-5 overflow-x-auto no-scrollbar scroll-smooth pb-3 pt-1 -mx-4 px-4 sm:-mx-6 sm:px-6">
          {videos.slice(0, 6).map((video) => (
            <div
              key={video.id}
              className="w-[280px] sm:w-[320px] md:w-[340px] shrink-0 flex flex-col"
            >
              <VideoCard video={video} onSelect={setActiveVideo} />
            </div>
          ))}
        </div>
      </div>

      {/* Video Modal Player */}
      <VideoModal video={activeVideo} onClose={() => setActiveVideo(null)} />
    </section>
  );
}
