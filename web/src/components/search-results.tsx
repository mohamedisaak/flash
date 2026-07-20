"use client";

/**
 * Client-side search results powered by TanStack Query.
 *
 * Unlike the server-rendered pages, search is interactive: the query comes from
 * the URL and results are fetched *in the browser*. `useQuery` handles the
 * loading/error/success states and caches results per query string, so typing a
 * previous search is instant. See teaching/17-react-query/02-usequery.md.
 */
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { env } from "@/lib/env";
import { formatDate } from "@/lib/utils";
import type { ArticleListItem, Paginated } from "@/lib/types";

async function fetchSearch(q: string): Promise<Paginated<ArticleListItem>> {
  const res = await fetch(`${env.apiUrl}/search/?q=${encodeURIComponent(q)}`);
  if (!res.ok) throw new Error("Search request failed");
  return res.json();
}

export function SearchResults({ q }: { q: string }) {
  const { data, isPending, isError } = useQuery({
    queryKey: ["search", q],
    queryFn: () => fetchSearch(q),
    enabled: q.length > 0, // don't fire for an empty query
  });

  if (!q) return <p className="text-[var(--muted)]">Type a query above to search.</p>;
  if (isPending) return <p className="text-[var(--muted)]">Searching…</p>;
  if (isError) return <p className="text-brand">Something went wrong. Is the API running?</p>;

  if (data.results.length === 0) {
    return <p className="text-[var(--muted)]">No results for “{q}”.</p>;
  }

  return (
    <div>
      <p className="mb-4 text-sm text-[var(--muted)]">
        {data.count} result{data.count === 1 ? "" : "s"} for “{q}”
      </p>
      <ul className="divide-y divide-[var(--border)]">
        {data.results.map((a) => (
          <li key={a.id} className="py-3">
            <Link href={`/articles/${a.slug}`} className="group">
              <span className="text-xs font-semibold text-brand uppercase">{a.category.name}</span>
              <h3 className="text-lg font-bold group-hover:underline">{a.title}</h3>
              {a.excerpt && <p className="text-sm text-[var(--muted)] line-clamp-2">{a.excerpt}</p>}
              <p className="mt-1 text-xs text-[var(--muted)]">{formatDate(a.published_at)}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
