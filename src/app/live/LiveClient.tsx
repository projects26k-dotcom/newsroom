"use client";

import { useState, useEffect } from "react";
import { ResolvedChannel } from "@/lib/channels";
import { LiveVideoResult } from "@/lib/youtubeLive";
import { ExternalLink, Radio, Tv, AlertCircle, Loader2 } from "lucide-react";

interface LiveClientProps {
  channels: ResolvedChannel[];
  initialSlug: string;
  initialLiveVideo: LiveVideoResult | null;
}

const STORAGE_KEY = "newsroom_selected_live_channel";

export function LiveClient({
  channels,
  initialSlug,
  initialLiveVideo,
}: LiveClientProps) {
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
    return initialSlug || channels[0]?.slug || "";
  });

  const [liveVideo, setLiveVideo] = useState<LiveVideoResult | null>(
    selectedSlug === initialSlug ? initialLiveVideo : null
  );
  const [isLoading, setIsLoading] = useState<boolean>(selectedSlug !== initialSlug);

  // If user had a different channel in localStorage than server default, fetch on mount
  useEffect(() => {
    if (selectedSlug !== initialSlug) {
      let isMounted = true;
      setIsLoading(true);
      fetch(`/api/live?channel=${encodeURIComponent(selectedSlug)}`)
        .then((res) => res.json())
        .then((data) => {
          if (isMounted) {
            setLiveVideo(data.liveVideo || null);
            setIsLoading(false);
          }
        })
        .catch(() => {
          if (isMounted) {
            setLiveVideo(null);
            setIsLoading(false);
          }
        });

      return () => {
        isMounted = false;
      };
    }
  }, [selectedSlug, initialSlug]);

  const handleSelectChannel = async (slug: string) => {
    if (slug === selectedSlug) return;

    setSelectedSlug(slug);
    setIsLoading(true);

    try {
      localStorage.setItem(STORAGE_KEY, slug);
    } catch {
      // Ignore localStorage error
    }

    try {
      const res = await fetch(`/api/live?channel=${encodeURIComponent(slug)}`);
      const data = await res.json();
      setLiveVideo(data.liveVideo || null);
    } catch {
      setLiveVideo(null);
    } finally {
      setIsLoading(false);
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

  const directLiveUrl = liveVideo?.videoId
    ? `https://www.youtube.com/watch?v=${liveVideo.videoId}`
    : `https://www.youtube.com/channel/${currentChannel.resolvedId}/live`;

  return (
    <div className="space-y-8">
      {/* Page Title & Status Header */}
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
              Official YouTube video stream feeds from verified national & international newsrooms
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600"></span>
          </span>
          <span className="font-mono text-xs uppercase tracking-wider text-red-600 dark:text-red-400 font-semibold">
            Live Stream
          </span>
        </div>
      </div>

      {/* Main 16:9 Live Video Player */}
      <div className="flex flex-col gap-4">
        <div className="relative aspect-[16/9] w-full max-w-5xl mx-auto overflow-hidden rounded-2xl bg-stone-950 border border-stone-800 shadow-2xl">
          {isLoading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-stone-950 text-stone-400">
              <Loader2 className="w-10 h-10 animate-spin text-red-600 mb-3" />
              <p className="font-mono text-xs uppercase tracking-wider">
                Connecting to {currentChannel.name}...
              </p>
            </div>
          ) : liveVideo && liveVideo.embeddable ? (
            /* Live Stream Video Embed */
            <iframe
              key={liveVideo.videoId}
              src={`https://www.youtube-nocookie.com/embed/${liveVideo.videoId}?autoplay=1&rel=0`}
              title={`${currentChannel.name} Live Stream`}
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
              className="absolute inset-0 h-full w-full border-0"
            />
          ) : (
            /* Poster card when not available to embed or channel offline */
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 sm:p-10 text-center bg-gradient-to-br from-stone-900 via-stone-950 to-black select-none">
              <div className="relative z-10 flex flex-col items-center max-w-lg">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-stone-800/80 text-amber-500 border border-stone-700 shadow-xl mb-4">
                  <AlertCircle className="h-8 w-8" />
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/60 text-amber-400 border border-amber-800/60 text-xs font-semibold uppercase tracking-wider mb-2">
                  <span>Not available to embed</span>
                </div>

                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white mb-2">
                  {currentChannel.name}
                </h2>

                <p className="text-xs sm:text-sm text-stone-400 mb-6 leading-relaxed">
                  This broadcast is either currently off-air or embedding has been restricted by the channel owner.
                  You can watch the official live broadcast directly on YouTube.
                </p>

                <a
                  href={directLiveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2.5 px-6 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs sm:text-sm uppercase tracking-wider transition-all duration-200 shadow-lg hover:shadow-red-900/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  <span>Watch on YouTube</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Player Meta & Action Bar */}
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
                {liveVideo?.embeddable && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400">
                    Broadcasting
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                Channel ID: <span className="font-mono text-[11px]">{currentChannel.resolvedId}</span>
                {liveVideo?.videoId && (
                  <>
                    {" "}• Live Video ID: <span className="font-mono text-[11px] text-stone-600 dark:text-stone-300">{liveVideo.videoId}</span>
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            {/* Always visible "Watch on YouTube" button */}
            <a
              href={directLiveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold uppercase tracking-wider transition-colors shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
              title="Watch on official YouTube page"
            >
              <span>Watch on YouTube</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>

      {/* Channel Switcher Tabs/Buttons */}
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
