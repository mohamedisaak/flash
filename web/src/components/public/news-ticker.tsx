/**
 * "Latest News" ticker — a horizontally scrolling marquee of recent headlines.
 * Server Component: fetches the latest titles; the scroll is pure CSS (no JS).
 */
import Link from "next/link";
import { api } from "@/lib/api";

export async function NewsTicker() {
  const { results } = await api.listArticles({ page_size: 10, ordering: "-published_at" });
  if (results.length === 0) return null;

  // Duplicate the list so the marquee loops seamlessly.
  const items = [...results, ...results];

  return (
    <div className="border-y border-[var(--border)] bg-white">
      <div className="mx-auto flex max-w-6xl items-stretch overflow-hidden">
        <span className="flex shrink-0 items-center bg-brand px-4 py-2 text-sm font-bold text-white">
          Latest News
        </span>
        <div className="relative flex-1 overflow-hidden py-2">
          <div className="ticker-track">
            {items.map((a, i) => (
              <Link
                key={`${a.id}-${i}`}
                href={`/articles/${a.slug}`}
                className="mx-6 text-sm text-[var(--foreground)] hover:text-brand"
              >
                <span className="mr-2 text-accent">●</span>
                {a.title}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
