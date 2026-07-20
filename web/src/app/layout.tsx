/**
 * Root layout — the single <html>/<body> wrapper for the whole app.
 *
 * It holds only the site-wide metadata and the client Providers. The *chrome*
 * (header/footer) differs per area, so it lives in nested layouts:
 * - `(site)/layout.tsx` → public news site (header, nav, footer)
 * - `dashboard/(app)/layout.tsx` → full-screen admin/author panel
 * See teaching/12-nextjs/07-dashboard-and-forms.md.
 */
import type { Metadata } from "next";
import { env } from "@/lib/env";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(env.siteUrl),
  title: { default: "Flash News", template: "%s — Flash News" },
  description: "Breaking news, politics, business, sport and more.",
  openGraph: { siteName: "Flash News", type: "website" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
