"use client";

import { useState } from "react";
import { VideoItem } from "@/lib/videos";
import { ResolvedChannel } from "@/lib/channels";
import { VideoCard } from "@/components/VideoCard";
import { VideoModal } from "@/components/VideoModal";
import { Video, Filter } from "lucide-react";

interface VideosClientProps {
  videos: VideoItem[];
  channels: ResolvedChannel[];
}

export function VideosClient({ videos, channels }: VideosClientProps) {
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [activeVideo, setActiveVideo] = useState<VideoItem | null>(null);

  const filteredVideos =
    selectedFilter === "all"
      ? videos
      : videos.filter((v) => v.channelSlug === selectedFilter);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between border-b-2 border-stone-900 dark:border-stone-100 pb-4 gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-600 text-white shadow-md">
            <Video className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-50">
              Video Dispatches
            </h1>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Curated news bulletins and field reports from top broadcast channels
            </p>
          </div>
        </div>

        <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-stone-100 dark:bg-stone-850 text-stone-600 dark:text-stone-400 self-start sm:self-auto">
          {filteredVideos.length} videos available
        </span>
      </div>

      {/* Channel Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 scroll-smooth">
        <span className="shrink-0 flex items-center gap-1 font-mono uppercase text-stone-400 dark:text-stone-500 tracking-wider text-[10px] pr-2 border-r border-stone-200 dark:border-stone-800">
          <Filter className="w-3 h-3 text-red-600" />
          <span>Filter:</span>
        </span>

        <button
          type="button"
          onClick={() => setSelectedFilter("all")}
          className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
            selectedFilter === "all"
              ? "border-red-600 bg-red-600 text-white shadow-xs"
              : "border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 hover:border-stone-400 dark:hover:border-stone-600 bg-white dark:bg-stone-900"
          }`}
        >
          All Desks ({videos.length})
        </button>

        {channels.map((ch) => {
          const count = videos.filter((v) => v.channelSlug === ch.slug).length;
          const isSelected = selectedFilter === ch.slug;
          return (
            <button
              key={ch.slug}
              type="button"
              onClick={() => setSelectedFilter(ch.slug)}
              className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                isSelected
                  ? "border-red-600 bg-red-600 text-white shadow-xs"
                  : "border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 hover:border-stone-400 dark:hover:border-stone-600 bg-white dark:bg-stone-900"
              }`}
            >
              {ch.name} {count > 0 ? `(${count})` : ""}
            </button>
          );
        })}
      </div>

      {/* Video Grid */}
      {filteredVideos.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
          {filteredVideos.map((video) => (
            <VideoCard
              key={`${video.channelSlug}-${video.id}`}
              video={video}
              onSelect={setActiveVideo}
            />
          ))}
        </div>
      ) : (
        <div className="py-16 text-center text-stone-500 border border-dashed border-stone-300 dark:border-stone-800 rounded-2xl">
          <p className="font-serif text-lg">No video dispatches found for this desk.</p>
          <button
            type="button"
            onClick={() => setSelectedFilter("all")}
            className="mt-3 text-xs font-bold uppercase tracking-wider text-red-600 hover:underline"
          >
            Reset filter
          </button>
        </div>
      )}

      {/* Video Modal Player */}
      <VideoModal video={activeVideo} onClose={() => setActiveVideo(null)} />
    </div>
  );
}
