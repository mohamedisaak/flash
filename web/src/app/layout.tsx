/**
 * Root layout — the single <html>/<body> wrapper for the whole app.
 *
 * It also applies the **admin-configurable** site theme: the brand/accent colours
 * from CMS site settings are injected as CSS variables here, so changing them in
 * the dashboard restyles the whole site (Tailwind's `bg-brand` etc. read these
 * variables). Site name, description and Google Analytics also come from settings.
 * See teaching/12-nextjs/07-dashboard-and-forms.md.
 */
import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { api } from "@/lib/api";
import { env } from "@/lib/env";
import { safeColor, shade } from "@/lib/utils";
import { Providers } from "./providers";
import "./globals.css";

/**
 * Viewport + theme colour. `themeColor` tints the mobile browser chrome and
 * feeds the Page-Experience signal set; `width`/`initialScale` guarantee a
 * correct responsive viewport (Next emits sensible defaults, made explicit here).
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#4f63d2" },
    { media: "(prefers-color-scheme: dark)", color: "#1a1a2e" },
  ],
};

export async function generateMetadata(): Promise<Metadata> {
  const s = await api.getSiteSettings();
  const name = s?.site_name || "Flash News";
  const description = s?.about_us || "Breaking news, politics, business, sport and more.";
  return {
    metadataBase: new URL(env.siteUrl),
    title: { default: name, template: `%s — ${name}` },
    description,
    applicationName: name,
    // Advertise the RSS feed site-wide. NOTE: no default canonical is set here
    // on purpose — a global canonical would make every page without its own
    // canonical point at the home page. Each indexable page sets its own.
    alternates: {
      types: {
        "application/rss+xml": [{ url: "/feed.xml", title: `${name} — Latest` }],
      },
    },
    // Sensible default: index & follow. Private pages (dashboard, search) set
    // their own noindex. googleBot gets full snippet/preview allowances.
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    openGraph: {
      siteName: name,
      type: "website",
      locale: "en_US",
      url: "/",
      title: name,
      description,
    },
    twitter: { card: "summary_large_image", title: name, description },
    formatDetection: { telephone: false, email: false, address: false },
    // Icons are auto-detected from src/app/icon.svg by Next's file convention, so
    // no explicit `icons` field is needed (setting one to a missing favicon.ico
    // would 404 and override the working SVG icon).
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const s = await api.getSiteSettings();
  const brand = safeColor(s?.theme_color_1, "#4f63d2");
  const accent = safeColor(s?.theme_color_2, "#1dc175");
  // Unlayered :root overrides beat Tailwind's @theme tokens, so this restyles
  // every `bg-brand`/`text-accent`/… utility at runtime.
  const themeCss =
    `:root{--color-brand:${brand};--color-brand-dark:${shade(brand, -14)};` +
    `--color-accent:${accent};--color-accent-dark:${shade(accent, -14)};}`;

  const gaId = (s?.google_analytics_id || "").trim();
  const gaValid = /^[A-Za-z0-9-]+$/.test(gaId);

  return (
    <html lang="en">
      <body className="min-h-screen">
        <style dangerouslySetInnerHTML={{ __html: themeCss }} />
        <Providers>{children}</Providers>
        {gaValid ? (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
              strategy="afterInteractive"
            />
            <Script id="ga-init" strategy="afterInteractive">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gaId}');`}
            </Script>
          </>
        ) : null}
        {/* Google AdSense loader — injected once, only when a publisher id is
            configured. This single script powers BOTH modes at the same time:
            (a) the manual <ins> units (AdSenseUnit) that fill each named slot
            with no house ad, and (b) Auto Ads, which Google places anywhere on
            the page once you enable it for the site in the AdSense dashboard
            (set NEXT_PUBLIC_ADSENSE_AUTO_ADS=true to also collapse empty slots
            so Auto Ads has room). Auto Ads automatically avoids your existing
            ad units, so it won't stack on a slot that's showing a house ad. */}
        {env.adsense.client ? (
          <Script
            id="adsbygoogle-loader"
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${env.adsense.client}`}
            strategy="afterInteractive"
            crossOrigin="anonymous"
          />
        ) : null}
      </body>
    </html>
  );
}
