"use client";

/**
 * A small search input that navigates to /search?q=... on submit.
 *
 * It's a Client Component because it uses state + the router (browser-only). The
 * heavier autocomplete/results live on the search page. See
 * teaching/13-react/02-state-and-hooks.md.
 */
import { useRouter } from "next/navigation";
import { useState } from "react";

export function SearchBox() {
  const router = useRouter();
  const [q, setQ] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (q.trim()) router.push(`/search?q=${encodeURIComponent(q.trim())}`);
      }}
    >
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search news…"
        aria-label="Search news"
        className="w-full rounded-md border border-[var(--border)] bg-transparent px-3 py-1.5 text-sm outline-none focus:border-brand"
      />
    </form>
  );
}
