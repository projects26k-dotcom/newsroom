"use client";

import { Play, Clock } from "lucide-react";
import { VideoItem } from "@/lib/videos";

interface VideoCardProps {
  video: VideoItem;
  onSelect: (video: VideoItem) => void;
  className?: string;
}

export function VideoCard({ video, onSelect, className = "" }: VideoCardProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(video)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(video);
        }
      }}
      className={`group flex flex-col h-full bg-white dark:bg-stone-900/70 rounded-xl border border-stone-200/90 dark:border-stone-800/80 overflow-hidden hover:border-stone-400 dark:hover:border-stone-700 transition-all duration-300 hover:shadow-lg dark:hover:shadow-stone-950/40 cursor-pointer select-none text-left ${className}`}
      aria-label={`Watch video: ${video.title}`}
    >
      {/* 16:9 Thumbnail Visual */}
      <div className="relative aspect-[16/9] w-full bg-stone-900 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={video.thumbnail}
          alt={video.title}
          loading="lazy"
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Hover overlay with Play Button */}
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-300 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:bg-red-600">
            <Play className="w-5 h-5 fill-white ml-0.5" />
          </div>
        </div>

        {/* Duration badge if available */}
        {video.duration && (
          <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded bg-black/80 text-white text-[10px] font-mono font-medium backdrop-blur-xs">
            {video.duration}
          </div>
        )}

        {/* Channel badge overlay */}
        <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded bg-black/70 text-white text-[10px] font-semibold uppercase tracking-wider backdrop-blur-xs">
          {video.channelName}
        </div>
      </div>

      {/* Content Meta */}
      <div className="flex flex-col flex-1 p-4 justify-between">
        <div>
          <h3 className="font-serif text-sm sm:text-base font-bold text-stone-900 dark:text-stone-100 line-clamp-2 leading-snug group-hover:text-red-700 dark:group-hover:text-red-400 transition-colors">
            {video.title}
          </h3>
        </div>

        <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-stone-100 dark:border-stone-800/80 text-xs text-stone-500 dark:text-stone-400">
          <span className="font-medium truncate max-w-[65%]">{video.channelName}</span>
          <div className="flex items-center gap-1 font-mono text-[11px] text-stone-400 shrink-0">
            <Clock className="w-3 h-3" />
            <span>{video.timeAgo}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
