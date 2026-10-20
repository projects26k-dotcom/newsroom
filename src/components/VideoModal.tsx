"use client";

import { useEffect } from "react";
import { X, ExternalLink, Play } from "lucide-react";
import { VideoItem } from "@/lib/videos";

interface VideoModalProps {
  video: VideoItem | null;
  onClose: () => void;
}

export function VideoModal({ video, onClose }: VideoModalProps) {
  useEffect(() => {
    if (!video) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    // Lock body scroll
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [video, onClose]);

  if (!video) return null;

  const ytWatchUrl = `https://www.youtube.com/watch?v=${video.id}`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={video.title}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative flex flex-col w-full max-w-4xl bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar with Close Button */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-stone-800 bg-stone-950/60">
          <div className="flex items-center gap-2 min-w-0 pr-4">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-600 text-white shrink-0">
              <Play className="w-2.5 h-2.5 fill-current" />
              <span>Playing</span>
            </span>
            <span className="text-xs font-semibold text-stone-300 truncate">
              {video.channelName}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-600 shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 16:9 Official YouTube NoCookie Player (Autoplay ON) */}
        <div className="relative aspect-[16/9] w-full bg-black">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1&rel=0`}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="absolute inset-0 w-full h-full border-0"
          />
        </div>

        {/* Bottom Details Row & "Watch on YouTube" */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 sm:p-5 bg-stone-950/80">
          <div className="min-w-0">
            <h2 className="font-serif text-base sm:text-lg font-bold text-white line-clamp-2 leading-snug">
              {video.title}
            </h2>
            <div className="flex items-center gap-2 text-xs text-stone-400 mt-1">
              <span className="font-medium text-stone-300">{video.channelName}</span>
              <span>•</span>
              <span>{video.timeAgo}</span>
            </div>
          </div>

          <a
            href={ytWatchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold uppercase tracking-wider transition-colors shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <span>Watch on YouTube</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
