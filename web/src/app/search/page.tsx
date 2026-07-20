/**
 * Search page.
 *
 * A Server Component reads the `?q=` param (a Promise in Next 16) and hands it to
 * the client `<SearchResults>` component, which does the actual fetching with
 * TanStack Query. Search pages shouldn't be indexed as duplicate content, so we
 * mark them `noindex`. See teaching/12-nextjs/06-routing-and-params.md.
 */
import type { Metadata } from "next";
import { SearchResults } from "@/components/search-results";

export const metadata: Metadata = {
  title: "Search",
  robots: { index: false, follow: true },
};

type PageProps = { searchParams: Promise<{ q?: string }> };

export default async function SearchPage({ searchParams }: PageProps) {
  const { q = "" } = await searchParams;

  return (
    <div>
      <h1 className="mb-4 text-2xl font-extrabold">Search</h1>
      <SearchResults q={q} />
    </div>
  );
}
