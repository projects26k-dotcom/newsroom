"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Client Error boundary caught:", error);
  }, [error]);

  return (
    <div className="py-20 text-center max-w-xl mx-auto space-y-6">
      <div className="w-16 h-16 mx-auto rounded-full bg-red-100 dark:bg-red-950/50 flex items-center justify-center text-red-600 dark:text-red-400">
        <AlertTriangle className="w-8 h-8" />
      </div>

      <div className="space-y-2">
        <span className="text-xs font-mono uppercase tracking-widest text-red-700 dark:text-red-400 font-semibold">
          System Notice
        </span>
        <h1 className="font-serif text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-50">
          Newsroom encountered an issue
        </h1>
        <p className="text-stone-500 dark:text-stone-400 text-sm leading-relaxed">
          The news wire could not be loaded at this time. Please try refreshing the feed.
        </p>
      </div>

      <div className="pt-4">
        <button
          type="button"
          onClick={() => reset()}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-stone-200 text-white dark:text-stone-900 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Try Again</span>
        </button>
      </div>
    </div>
  );
}
