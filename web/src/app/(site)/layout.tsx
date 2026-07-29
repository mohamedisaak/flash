/**
 * Public site layout — the news website chrome (header, nav bar, ticker, and
 * the 4-column footer) around every public page. The dashboard sits outside
 * this route group, so it doesn't get this chrome.
 */
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PageViewTracker } from "@/components/public/page-view-tracker";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <PageViewTracker />
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>
      <SiteFooter />
    </div>
  );
}
