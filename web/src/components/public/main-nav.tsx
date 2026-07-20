/**
 * The blue primary navigation bar with category dropdowns.
 *
 * Top-level categories (parent === null) become nav items; their child
 * categories appear in a hover dropdown (CSS group-hover, no JS). A "Gallery"
 * item links to the photo/video galleries.
 */
import Link from "next/link";
import { api } from "@/lib/api";
import type { Category } from "@/lib/types";

function Caret() {
  return (
    <svg className="ml-1 inline h-3 w-3" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path d="M5.5 7.5 10 12l4.5-4.5z" />
    </svg>
  );
}

export async function MainNav() {
  const categories = await api.listCategories();
  const top = categories.filter((c) => c.parent === null).sort((a, b) => a.order - b.order);
  const childrenOf = (id: number) => categories.filter((c) => c.parent === id);

  return (
    <nav className="bg-brand text-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center px-4">
        <Link href="/" className="px-4 py-3 text-sm font-semibold hover:bg-brand-dark">
          Home
        </Link>
        {top.map((c: Category) => {
          const kids = childrenOf(c.id);
          return (
            <div key={c.id} className="group relative">
              <Link href={`/${c.slug}`} className="flex items-center px-4 py-3 text-sm font-semibold hover:bg-brand-dark">
                {c.name}
                {kids.length > 0 && <Caret />}
              </Link>
              {kids.length > 0 && (
                <div className="invisible absolute left-0 top-full z-20 min-w-44 bg-white text-[var(--foreground)] opacity-0 shadow-lg transition group-hover:visible group-hover:opacity-100">
                  {kids.map((k) => (
                    <Link key={k.id} href={`/${k.slug}`} className="block px-4 py-2 text-sm hover:bg-gray-100">
                      {k.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        <div className="group relative">
          <span className="flex cursor-default items-center px-4 py-3 text-sm font-semibold hover:bg-brand-dark">
            Gallery <Caret />
          </span>
          <div className="invisible absolute left-0 top-full z-20 min-w-44 bg-white text-[var(--foreground)] opacity-0 shadow-lg transition group-hover:visible group-hover:opacity-100">
            <Link href="/photo-gallery" className="block px-4 py-2 text-sm hover:bg-gray-100">Photo Gallery</Link>
            <Link href="/video-gallery" className="block px-4 py-2 text-sm hover:bg-gray-100">Video Gallery</Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
