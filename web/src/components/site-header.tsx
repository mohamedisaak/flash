/**
 * Site header (NewsPortal style): a utility top bar, a logo + advertisement
 * banner row, the blue category nav, and the latest-news ticker.
 *
 * Server Component: nav/ticker fetch their data on the server for SEO + speed.
 * See teaching/12-nextjs/03-server-vs-client-components.md.
 */
import Link from "next/link";
import { api } from "@/lib/api";
import { Ad } from "./public/ad";
import { TopBar } from "./public/top-bar";
import { MainNav } from "./public/main-nav";
import { NewsTicker } from "./public/news-ticker";

export async function SiteHeader() {
  const settings = await api.getSiteSettings();
  const name = settings?.site_name || "Flash News";
  const [firstWord, ...restWords] = name.split(" ");
  const showTicker = settings?.news_ticker_status ?? true;
  const tickerTotal = settings?.news_ticker_total || 10;

  return (
    <header>
      <TopBar />
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-6 px-4 py-4">
        <Link href="/" className="flex items-center gap-2">
          <span
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand"
            aria-hidden
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="#ffffff">
              <path d="M13 2 L3 14 h9 l-1 8 L21 10 h-9 z" />
            </svg>
          </span>
          <span className="text-3xl font-extrabold tracking-tight">
            <span className="text-brand">{firstWord}</span>
            {restWords.length > 0 && <span> {restWords.join(" ")}</span>}
          </span>
        </Link>
        {/* Header advertisement slot — shows ads with placement="header". */}
        <div className="ml-auto hidden w-full max-w-2xl md:block">
          <Ad placement="header" height="h-24" placeholderClassName="h-24" />
        </div>
      </div>
      <MainNav />
      {showTicker && <NewsTicker limit={tickerTotal} />}
    </header>
  );
}
