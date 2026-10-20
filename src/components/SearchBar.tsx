"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";

interface SearchBarProps {
  initialQuery?: string;
}

const POPULAR_TOPICS = [
  "Artificial Intelligence",
  "Clean Energy",
  "Global Economy",
  "Semiconductors",
  "Space Exploration",
  "Biomedical Research",
  "Geopolitics",
];

export function SearchBar({ initialQuery = "" }: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery);
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed) {
      router.push(`/search?q=${encodeURIComponent(trimmed)}`);
    }
  };

  const handleTopicClick = (topic: string) => {
    setQuery(topic);
    router.push(`/search?q=${encodeURIComponent(topic)}`);
  };

  return (
    <div className="w-full max-w-3xl mx-auto mb-10">
      <form onSubmit={handleSubmit} className="relative flex items-center">
        <div className="absolute left-4 pointer-events-none text-stone-400">
          <Search className="w-5 h-5" />
        </div>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search global stories, topics, companies, or events..."
          className="w-full pl-12 pr-28 py-3.5 sm:py-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-stone-900 dark:text-white placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent text-sm sm:text-base shadow-xs transition-all"
        />

        <div className="absolute right-2 flex items-center gap-1">
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="p-1.5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 rounded-full"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-red-700 hover:bg-red-800 text-white text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
          >
            Search
          </button>
        </div>
      </form>

      {/* Popular Suggested Topics */}
      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
        <span className="text-stone-400 dark:text-stone-500 font-mono text-[11px] uppercase mr-1">
          Trending:
        </span>
        {POPULAR_TOPICS.map((topic) => (
          <button
            key={topic}
            type="button"
            onClick={() => handleTopicClick(topic)}
            className="px-2.5 py-1 rounded-full bg-stone-100 hover:bg-stone-200 dark:bg-stone-850 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 transition-colors cursor-pointer"
          >
            {topic}
          </button>
        ))}
      </div>
    </div>
  );
}
