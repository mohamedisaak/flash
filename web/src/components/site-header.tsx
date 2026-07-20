/**
 * Site header (NewsPortal style): a utility top bar, a logo + advertisement
 * banner row, the blue category nav, and the latest-news ticker.
 *
 * Server Component: nav/ticker fetch their data on the server for SEO + speed.
 * See teaching/12-nextjs/03-server-vs-client-components.md.
 */
import Link from "next/link";
import { TopBar } from "./public/top-bar";
import { MainNav } from "./public/main-nav";
import { NewsTicker } from "./public/news-ticker";

export function SiteHeader() {
  return (
    <header>
      <TopBar />
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-6 px-4 py-4">
        <Link href="/" className="text-3xl font-extrabold tracking-tight">
          <span className="text-brand">Flash</span>
          <span>News</span>
        </Link>
        {/* Header advertisement slot (placeholder). */}
        <div className="ml-auto hidden h-24 w-full max-w-2xl items-center justify-center bg-gray-200 text-lg font-semibold text-gray-400 md:flex">
          Advertisement
        </div>
      </div>
      <MainNav />
      <NewsTicker />
    </header>
  );
}
