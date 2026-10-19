import Link from "next/link";
import { CATEGORY_TABS, SOURCE_FILTERS } from "@/lib/feeds";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-stone-200 dark:border-stone-800 bg-stone-100/60 dark:bg-stone-950/60 py-12 text-stone-600 dark:text-stone-400 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-10 border-b border-stone-200/80 dark:border-stone-850">
          {/* Brand & Tagline */}
          <div className="md:col-span-5 space-y-3">
            <div className="flex items-baseline">
              <span className="font-serif text-2xl font-black tracking-tight text-stone-900 dark:text-white uppercase">
                Dispatch
              </span>
              <span className="w-1.5 h-1.5 ml-1 rounded-full bg-red-700 dark:bg-red-500 inline-block" />
            </div>
            <p className="text-sm text-stone-500 dark:text-stone-400 max-w-sm leading-relaxed">
              Curated real-time headlines and regional dispatches directly from Google News RSS.
            </p>
          </div>

          {/* Quick Category & Source Links */}
          <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-6">
            <div>
              <h3 className="text-xs font-mono uppercase tracking-wider text-stone-900 dark:text-stone-200 font-semibold mb-3">
                Sections
              </h3>
              <ul className="space-y-1.5 text-xs">
                {CATEGORY_TABS.map((tab) => (
                  <li key={tab.id}>
                    <Link
                      href={tab.href}
                      prefetch={false}
                      className="hover:text-red-700 dark:hover:text-red-400 transition-colors py-0.5 block"
                    >
                      {tab.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="col-span-1 sm:col-span-2">
              <h3 className="text-xs font-mono uppercase tracking-wider text-stone-900 dark:text-stone-200 font-semibold mb-3">
                Sources
              </h3>
              <ul className="grid grid-cols-2 gap-1.5 text-xs">
                {SOURCE_FILTERS.map((source) => (
                  <li key={source.id}>
                    <Link
                      href={`/source/${source.id}`}
                      prefetch={false}
                      className="hover:text-red-700 dark:hover:text-red-400 transition-colors py-0.5 block"
                    >
                      {source.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* STEP 5: Required exact footer line */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-500 dark:text-stone-400 gap-4">
          <p className="font-medium text-stone-800 dark:text-stone-200">
            Dispatch. News via Google News RSS. For personal use.
          </p>

          <p className="font-mono text-[11px] text-stone-400 dark:text-stone-500">
            Real-time server-side feeds • 300s cache
          </p>
        </div>
      </div>
    </footer>
  );
}
