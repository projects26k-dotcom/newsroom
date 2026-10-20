import Link from "next/link";
import { Search } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { CategoryNav } from "./CategoryNav";

export function Header() {
  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-stone-50/90 dark:bg-stone-950/90 border-b border-stone-200 dark:border-stone-800 transition-colors">
      {/* Top Masthead Row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 sm:h-20 border-b border-stone-200/60 dark:border-stone-800/60">
          {/* Left: Edition & Subtitle */}
          <div className="flex items-center space-x-3">
            <span className="hidden md:inline-block text-[11px] font-mono uppercase tracking-widest text-stone-500 dark:text-stone-400 border-r border-stone-200 dark:border-stone-800 pr-3">
              Google News Wire Edition
            </span>
            <span className="hidden sm:inline-block text-[11px] font-mono text-stone-400 dark:text-stone-500">
              {new Date().toLocaleDateString("en-IN", {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>

          {/* Center: Brand Masthead */}
          <div className="flex flex-col items-center justify-center text-center">
            <Link
              href="/"
              prefetch={false}
              className="group inline-flex items-baseline focus:outline-none focus-visible:ring-2 focus-visible:ring-red-600 rounded"
            >
              <span className="font-serif text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-stone-900 dark:text-white uppercase transition-colors group-hover:text-stone-700 dark:group-hover:text-stone-200">
                Newsroom
              </span>
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 ml-1 rounded-full bg-red-700 dark:bg-red-500 inline-block" />
            </Link>
          </div>

          {/* Right: Live, Videos, Search & Dark Mode */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <Link
              href="/live"
              prefetch={false}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/50 hover:bg-red-100 dark:hover:bg-red-900/60 transition-colors shadow-xs"
              title="Watch Live News Broadcasts"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
              </span>
              <span>Live</span>
            </Link>

            <Link
              href="/videos"
              prefetch={false}
              className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              title="Watch Videos"
            >
              <span>Videos</span>
            </Link>

            <Link
              href="/search"
              prefetch={false}
              aria-label="Search stories"
              className="p-2 rounded-full text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
              title="Search news"
            >
              <Search className="w-4 h-4" />
            </Link>

            <ThemeToggle />
          </div>
        </div>
      </div>

      {/* Category Links & Source Filters */}
      <CategoryNav />
    </header>
  );
}
