"use client";

import { useState, useEffect } from "react";
import { ResolvedChannel } from "@/lib/channels";
import { Play, ExternalLink, Radio, Tv } from "lucide-react";

interface LiveClientProps {
  channels: ResolvedChannel[];
}

const STORAGE_KEY = "newsroom_selected_live_channel";

export function LiveClient({ channels }: LiveClientProps) {
  const [selectedSlug, setSelectedSlug] = useState<string>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved && channels.some((c) => c.slug === saved)) {
          return saved;
        }
      } catch {
        // Ignore localStorage error
      }
    }
    return channels[0]?.slug || "";
  });

  const [hasStarted, setHasStarted] = useState<boolean>(false);

  // Sync selected channel to localStorage
  const handleSelectChannel = (slug: string) => {
    setSelectedSlug(slug);
    setHasStarted(true); // Automatically start player on explicit channel switch
    try {
      localStorage.setItem(STORAGE_KEY, slug);
    } catch {
      // Ignore localStorage error
    }
  };

  const currentChannel =
    channels.find((c) => c.slug === selectedSlug) || channels[0];

  if (!currentChannel) {
    return (
      <div className="py-16 text-center text-stone-500">
        No live channels configured.
      </div>
    );
  }

  const youtubeLiveUrl = `https://www.youtube.com/channel/${currentChannel.resolvedId}/live`;

  return (
    <div className="space-y-8">
      {/* Page Title & Intro */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between border-b-2 border-stone-900 dark:border-stone-100 pb-4 gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-600 text-white shadow-md">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-50">
              Live Broadcasts
            </h1>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Official YouTube embed feeds from verified national & international newsrooms
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600"></span>
          </span>
          <span className="font-mono text-xs uppercase tracking-wider text-red-600 dark:text-red-400 font-semibold">
            On Air
          </span>
        </div>
      </div>

      {/* Main 16:9 Live Stream Player */}
      <div className="flex flex-col gap-4">
        <div className="relative aspect-[16/9] w-full max-w-5xl mx-auto overflow-hidden rounded-2xl bg-stone-950 border border-stone-800 shadow-2xl">
          {hasStarted ? (
            /* Only the currently selected iframe loads in the DOM */
            <iframe
              key={currentChannel.resolvedId}
              src={`https://www.youtube-nocookie.com/embed/live_stream?channel=${currentChannel.resolvedId}&autoplay=1`}
              title={`${currentChannel.name} Live Stream`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="absolute inset-0 h-full w-full border-0"
            />
          ) : (
            /* Lazy poster: loads player only on user play click */
            <div
              onClick={() => setHasStarted(true)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setHasStarted(true);
                }
              }}
              className="group absolute inset-0 flex flex-col items-center justify-center p-6 text-center cursor-pointer select-none bg-gradient-to-br from-stone-900 via-stone-950 to-black"
              aria-label={`Start live stream for ${currentChannel.name}`}
            >
              {/* Subtle background glow */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(220,38,38,0.15)_0%,transparent_70%)] pointer-events-none" />

              <div className="relative z-10 flex flex-col items-center">
                <div className="flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-full bg-red-600 text-white shadow-2xl transition-transform duration-300 group-hover:scale-110 group-hover:bg-red-500 mb-5">
                  <Play className="ml-1 h-9 w-9 sm:h-11 sm:w-11 fill-white" />
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-950/70 text-red-400 border border-red-800/60 text-xs font-semibold uppercase tracking-wider mb-2">
                  <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                  <span>Click to Stream Live</span>
                </div>

                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white drop-shadow-sm">
                  {currentChannel.name}
                </h2>
                <p className="text-xs sm:text-sm text-stone-400 mt-1">
                  16:9 Official YouTube Player (youtube-nocookie.com)
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Player Status & "Watch on YouTube" Action Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 max-w-5xl mx-auto w-full p-4 sm:p-5 rounded-xl bg-white dark:bg-stone-900/60 border border-stone-200/90 dark:border-stone-800 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
              <Tv className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-lg font-bold text-stone-900 dark:text-stone-100">
                  {currentChannel.name}
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-700">
                  {currentChannel.language === "hi" ? "हिन्दी" : "English"}
                </span>
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                Channel ID: <span className="font-mono text-[11px]">{currentChannel.resolvedId}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            {/* Always visible "Watch on YouTube" button for when embedding is restricted or off-air */}
            <a
              href={youtubeLiveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold uppercase tracking-wider transition-colors shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
              title="Watch on official YouTube page if stream is offline or restricted"
            >
              <span>Watch on YouTube</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>

      {/* Channel Switcher */}
      <div className="max-w-5xl mx-auto w-full pt-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-stone-500 dark:text-stone-400">
            Select Channel Desk ({channels.length})
          </h2>
          <span className="text-[11px] font-mono text-stone-400">
            Click to switch live feed
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {channels.map((ch) => {
            const isSelected = ch.slug === selectedSlug;
            return (
              <button
                key={ch.slug}
                type="button"
                onClick={() => handleSelectChannel(ch.slug)}
                className={`flex flex-col p-3.5 rounded-xl border text-left transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-600 select-none ${
                  isSelected
                    ? "border-red-600 bg-red-50/80 dark:bg-red-950/40 shadow-sm"
                    : "border-stone-200/90 dark:border-stone-800 bg-white dark:bg-stone-900/60 hover:border-stone-400 dark:hover:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-850"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`inline-block h-2 w-2 rounded-full ${
                      isSelected
                        ? "bg-red-600 animate-pulse"
                        : "bg-stone-300 dark:bg-stone-700"
                    }`}
                  />
                  <span className="text-[10px] font-mono text-stone-400 uppercase">
                    {ch.language === "hi" ? "हिन्दी" : "EN"}
                  </span>
                </div>

                <span
                  className={`font-serif text-sm font-bold truncate leading-tight ${
                    isSelected
                      ? "text-red-700 dark:text-red-400"
                      : "text-stone-900 dark:text-stone-100"
                  }`}
                >
                  {ch.name}
                </span>

                <span className="text-[11px] font-mono text-stone-400 dark:text-stone-500 truncate mt-1">
                  {ch.youtubeHandle || ch.slug}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
