/**
 * robots.txt for the PUBLIC site domain.
 *
 * Crawlers fetch `https://<public-site>/robots.txt` — i.e. the Next.js origin,
 * not the API. The Django backend also emits a robots.txt/sitemaps, but those
 * live on the API host; this is the one search engines actually read for the
 * canonical site. It allows all public content and blocks the private surfaces
 * (dashboard, auth) and the low-value internal search results, then points at
 * the sitemaps served from this same origin.
 *
 * See teaching/23-seo/03-sitemaps-and-robots.md.
 */
import type { MetadataRoute } from "next";
import { env } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  const base = env.siteUrl.replace(/\/$/, "");
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Private/low-value routes kept out of the index. `/search` is a
        // thin internal-search results surface; everything under `/dashboard`
        // is the authenticated CMS.
        disallow: ["/dashboard", "/dashboard/", "/search"],
      },
    ],
    sitemap: [`${base}/sitemap.xml`, `${base}/news-sitemap.xml`],
    host: base,
  };
}
