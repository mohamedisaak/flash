/**
 * Root layout — wraps every page.
 *
 * The `metadata` export sets site-wide SEO defaults; individual pages override
 * pieces of it via their own `generateMetadata`. `metadataBase` lets Next
 * resolve relative Open Graph URLs to absolute ones. See
 * teaching/12-nextjs/05-images-and-metadata.md.
 */
import type { Metadata } from "next";
import { env } from "@/lib/env";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(env.siteUrl),
  title: {
    default: "Flash News",
    template: "%s — Flash News",
  },
  description: "Breaking news, politics, business, sport and more.",
  openGraph: {
    siteName: "Flash News",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <Providers>
          <SiteHeader />
          <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-6">{children}</main>
          <SiteFooter />
        </Providers>
      </body>
    </html>
  );
}
