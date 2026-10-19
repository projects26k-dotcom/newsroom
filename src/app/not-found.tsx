import Link from "next/link";
import { ArrowLeft, Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="py-20 text-center max-w-xl mx-auto space-y-6">
      <div className="w-16 h-16 mx-auto rounded-full bg-stone-100 dark:bg-stone-850 flex items-center justify-center text-stone-500">
        <Compass className="w-8 h-8" />
      </div>

      <div className="space-y-2">
        <span className="text-xs font-mono uppercase tracking-widest text-red-700 dark:text-red-400 font-semibold">
          Error 404
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-stone-900 dark:text-stone-50">
          Dispatch Not Found
        </h1>
        <p className="text-stone-500 dark:text-stone-400 text-sm sm:text-base leading-relaxed">
          The section or dispatch you are looking for has been archived, moved, or does not exist.
        </p>
      </div>

      <div className="pt-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-stone-200 text-white dark:text-stone-900 text-xs font-semibold uppercase tracking-wider transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Front Page</span>
        </Link>
      </div>
    </div>
  );
}
