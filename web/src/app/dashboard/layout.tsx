/**
 * Dashboard root layout — applies to both the login page and the gated area.
 * We mark the whole dashboard `noindex` so search engines never crawl it.
 */
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
