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
                Dispatch
              </span>
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 ml-1 rounded-full bg-red-700 dark:bg-red-500 inline-block" />
            </Link>
          </div>

          {/* Right: Search & Dark Mode */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <Link
              href="/search"
              prefetch={false}
              aria-label="Search dispatches"
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
