"use client";

import { AlertCircle, RotateCcw } from "lucide-react";

interface ErrorNoticeProps {
  message?: string;
}

export function ErrorNotice({
  message = "News temporarily unavailable, refresh in a minute",
}: ErrorNoticeProps) {
  return (
    <div className="w-full my-8 p-8 sm:p-12 text-center rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/50 shadow-xs max-w-2xl mx-auto">
      <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center">
        <AlertCircle className="w-6 h-6" />
      </div>

      <h3 className="font-serif text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100 mb-2">
        {message}
      </h3>

      <p className="text-sm text-stone-500 dark:text-stone-400 max-w-md mx-auto mb-6 leading-relaxed">
        Live news stories could not be fetched from the feed right now. Please refresh in a moment to reload current stories.
      </p>

      <button
        type="button"
        onClick={() => window.location.reload()}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-stone-200 text-white dark:text-stone-900 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
      >
        <RotateCcw className="w-4 h-4" />
        <span>Refresh Feed</span>
      </button>
    </div>
  );
}
