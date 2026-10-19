"use client";

import { useEffect, useRef, useState } from "react";
import { getGradientFromText, getPublisherDomain } from "@/lib/utils";

interface ArticleThumbnailProps {
  articleUrl: string;
  source: string;
  immediate?: boolean;
  className?: string;
  aspectClass?: string;
}

export function ArticleThumbnail({
  articleUrl,
  source,
  immediate = false,
  className = "",
  aspectClass = "aspect-[16/9]",
}: ArticleThumbnailProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [domain, setDomain] = useState(() => getPublisherDomain(source, articleUrl));
  const [logoError, setLogoError] = useState(false);

  const initial = (source.replace(/^www\./i, "")[0] || "D").toUpperCase();
  const gradient = getGradientFromText(source || "Dispatch");

  useEffect(() => {
    let isMounted = true;

    async function fetchThumbnail() {
      try {
        const res = await fetch(`/api/thumb?link=${encodeURIComponent(articleUrl)}`);
        if (!res.ok) return;
        const data = await res.json();
        if (isMounted) {
          if (data.image) {
            setImageUrl(data.image);
          }
          if (data.publisherUrl) {
            setDomain(getPublisherDomain(source, data.publisherUrl));
          }
        }
      } catch {
        // Fallback remains active
      }
    }

    if (immediate) {
      fetchThumbnail();
      return;
    }

    // IntersectionObserver for lazy fetching when scrolled into view
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchThumbnail();
          observer.disconnect();
        }
      },
      {
        rootMargin: "250px",
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      isMounted = false;
      observer.disconnect();
    };
  }, [articleUrl, immediate, source]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full ${aspectClass} overflow-hidden select-none ${className}`}
    >
      {/* Fallback (never leaves card empty): gradient + publisher logo + source name below */}
      <div
        className={`absolute inset-0 w-full h-full bg-gradient-to-br ${gradient.from} ${gradient.to} flex flex-col items-center justify-center p-4 transition-opacity duration-300 ${
          imageLoaded ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
        aria-hidden={imageLoaded}
      >
        {/* Subtle geometric dot texture */}
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:12px_12px]" />

        {/* Centered publisher logo with monogram backup (only visible while image is not loaded) */}
        {!imageLoaded && (
          <div className="relative flex flex-col items-center justify-center">
            {!logoError ? (
              <div className="w-12 h-12 rounded-xl bg-white/95 dark:bg-stone-900/90 shadow-md p-1.5 flex items-center justify-center border border-white/20">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://www.google.com/s2/favicons?domain=${domain}&sz=128`}
                  alt={source}
                  referrerPolicy="no-referrer"
                  onError={() => setLogoError(true)}
                  className="w-8 h-8 object-contain"
                />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-full border border-white/25 bg-white/10 backdrop-blur-xs flex items-center justify-center text-white font-serif font-black text-xl shadow-inner">
                {initial}
              </div>
            )}

            {/* Source name centered below */}
            <span className="mt-2.5 text-xs font-mono tracking-wider uppercase text-white/90 font-medium truncate max-w-[90%] text-center shadow-xs">
              {source}
            </span>
          </div>
        )}
      </div>

      {/* Real article thumbnail (faded in on load) */}
      {imageUrl && !hasError && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt={source}
          loading="lazy"
          referrerPolicy="no-referrer"
          onLoad={() => setImageLoaded(true)}
          onError={() => setHasError(true)}
          className={`absolute inset-0 w-full h-full object-cover z-10 transition-all duration-500 group-hover:scale-103 ${
            imageLoaded ? "opacity-100 scale-100" : "opacity-0 scale-105 pointer-events-none"
          }`}
        />
      )}
    </div>
  );
}
