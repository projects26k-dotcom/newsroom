"use client";

import { useState } from "react";
import { Play } from "lucide-react";

interface LazyVideoPlayerProps {
  videoId: string;
  title: string;
  thumbnailUrl?: string;
  autoplay?: boolean;
  channelName?: string;
  className?: string;
}

export function LazyVideoPlayer({
  videoId,
  title,
  thumbnailUrl,
  autoplay = false,
  channelName,
  className = "",
}: LazyVideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(autoplay);
  const poster = thumbnailUrl || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

  if (isPlaying) {
    return (
      <div className={`relative aspect-[16/9] w-full overflow-hidden rounded-xl bg-black shadow-lg ${className}`}>
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="absolute inset-0 h-full w-full border-0"
        />
      </div>
    );
  }

  return (
    <div
      onClick={() => setIsPlaying(true)}
      className={`group relative aspect-[16/9] w-full cursor-pointer overflow-hidden rounded-xl bg-stone-900 shadow-md ${className}`}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setIsPlaying(true);
        }
      }}
      aria-label={`Play video: ${title}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={poster}
        alt={title}
        loading="lazy"
        referrerPolicy="no-referrer"
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
      />

      {/* Subtle overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/30 transition-opacity duration-300 group-hover:from-black/90 group-hover:via-black/30" />

      {/* Centered Play Button */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-600 text-white shadow-xl transition-all duration-300 group-hover:scale-110 group-hover:bg-red-500 sm:h-20 sm:w-20">
          <Play className="ml-1 h-7 w-7 fill-white sm:h-9 sm:w-9" />
        </div>
      </div>

      {/* Title & Channel metadata overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
        {channelName && (
          <p className="text-xs font-semibold uppercase tracking-wider text-red-400 drop-shadow-sm">
            {channelName}
          </p>
        )}
        <h3 className="line-clamp-2 font-serif text-sm sm:text-base font-bold leading-snug drop-shadow-sm">
          {title}
        </h3>
      </div>
    </div>
  );
}
