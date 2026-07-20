import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-[var(--border)] mt-8">
      <div className="max-w-5xl mx-auto px-4 py-6 text-sm text-[var(--muted)] flex flex-wrap gap-x-6 gap-y-2 items-center">
        <span>© {new Date().getFullYear()} Flash News</span>
        <Link href="/rss/" className="hover:text-brand">RSS</Link>
        <Link href="/search" className="hover:text-brand">Search</Link>
        <span className="ml-auto">Built as a learning project.</span>
      </div>
    </footer>
  );
}
