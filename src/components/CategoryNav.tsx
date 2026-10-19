"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CATEGORY_TABS, SOURCE_FILTERS } from "@/lib/feeds";
import { Radio } from "lucide-react";

export function CategoryNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Category and source navigation"
      className="w-full border-t border-stone-200/80 dark:border-stone-800/80 bg-stone-50/70 dark:bg-stone-950/70"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Main Category Tabs */}
        <div className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto no-scrollbar py-2 text-xs uppercase tracking-wider font-medium scroll-smooth">
          {CATEGORY_TABS.map((tab) => {
            const isActive =
              tab.href === "/"
                ? pathname === "/"
                : pathname === tab.href || pathname?.startsWith(`${tab.href}/`);

            return (
              <Link
                key={tab.id}
                href={tab.href}
                prefetch={false}
                className={`relative shrink-0 px-3 py-1.5 rounded-md transition-all duration-200 ${
                  isActive
                    ? "text-red-700 dark:text-red-400 font-bold bg-red-50/90 dark:bg-red-950/40"
                    : "text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-850"
                }`}
              >
                {tab.name}
                {isActive && (
                  <span className="absolute bottom-0 left-3 right-3 h-[2px] bg-red-700 dark:bg-red-500 rounded-full" />
                )}
              </Link>
            );
          })}
        </div>

        {/* Source Filters Bar */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1.5 border-t border-stone-200/50 dark:border-stone-850 text-[11px] font-sans">
          <span className="shrink-0 flex items-center gap-1 font-mono uppercase text-stone-400 dark:text-stone-500 tracking-wider text-[10px] pl-1 pr-2 border-r border-stone-200 dark:border-stone-800">
            <Radio className="w-2.5 h-2.5 text-red-600 animate-pulse" />
            <span>Sources:</span>
          </span>

          <div className="flex items-center gap-1.5 shrink-0">
            {SOURCE_FILTERS.map((source) => {
              const href = `/source/${source.id}`;
              const isActive = pathname === href;

              return (
                <Link
                  key={source.id}
                  href={href}
                  prefetch={false}
                  className={`px-2.5 py-0.5 rounded-full border transition-colors ${
                    isActive
                      ? "border-red-600 bg-red-600 text-white font-medium"
                      : "border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 hover:border-stone-400 dark:hover:border-stone-600 hover:text-stone-900 dark:hover:text-stone-200 bg-white dark:bg-stone-900"
                  }`}
                >
                  {source.name}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
