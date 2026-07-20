/**
 * Site header with category navigation and a search link.
 *
 * This is a **Server Component** (no "use client"): it fetches the category list
 * on the server during render, so the nav is in the initial HTML — good for SEO
 * and speed. See teaching/12-nextjs/03-server-vs-client-components.md.
 */
import Link from "next/link";
import { api } from "@/lib/api";
import { SearchBox } from "./search-box";

export async function SiteHeader() {
  const categories = await api.listCategories();
  const topNav = categories.filter((c) => c.parent === null).slice(0, 7);

  return (
    <header className="border-b border-[var(--border)]">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-4">
        <Link href="/" className="text-2xl font-extrabold tracking-tight">
          <span className="text-brand">Flash</span> News
        </Link>
        <div className="ml-auto w-full max-w-xs">
          <SearchBox />
        </div>
      </div>
      <nav className="max-w-5xl mx-auto px-4 pb-2 flex flex-wrap gap-x-4 gap-y-1 text-sm font-medium">
        {topNav.map((c) => (
          <Link key={c.id} href={`/${c.slug}`} className="hover:text-brand">
            {c.name}
          </Link>
        ))}
      </nav>
    </header>
  );
}
