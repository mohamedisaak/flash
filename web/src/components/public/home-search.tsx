"use client";

/**
 * The home-page search bar: free-text + category + subcategory selects.
 * Submitting routes to /search with the query (category filtering is applied
 * there via the API's `category` param). Client Component (state + router).
 */
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Category } from "@/lib/types";

export function HomeSearch({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");

  const top = categories.filter((c) => c.parent === null);
  const subs = categories.filter((c) => String(c.parent) === category);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const params = new URLSearchParams();
        if (q.trim()) params.set("q", q.trim());
        router.push(`/search?${params.toString()}`);
      }}
      className="grid gap-3 border-y border-[var(--border)] py-5 sm:grid-cols-2 lg:grid-cols-4"
    >
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Title or Description"
        className="rounded border border-[var(--border)] px-3 py-2.5 text-sm outline-none focus:border-brand"
      />
      <select
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className="rounded border border-[var(--border)] px-3 py-2.5 text-sm outline-none focus:border-brand"
      >
        <option value="">Select Category</option>
        {top.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>
      <select
        className="rounded border border-[var(--border)] px-3 py-2.5 text-sm outline-none focus:border-brand"
        disabled={subs.length === 0}
      >
        <option value="">Select SubCategory</option>
        {subs.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>
      <button type="submit" className="rounded bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark">
        Search
      </button>
    </form>
  );
}
