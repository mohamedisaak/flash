/**
 * RSS 2.0 feed for the PUBLIC site domain (latest stories).
 *
 * Served at `/feed.xml` and advertised from the document <head> via the root
 * layout's `alternates.types`. Readers/aggregators subscribe to this; it also
 * signals freshness to search engines. URLs point at the canonical frontend
 * routes. See teaching/23-seo/04-rss-feeds.md.
 */
import { env } from "@/lib/env";
import { absoluteUrl } from "@/lib/seo";
import type { ArticleListItem, Paginated, SiteSettings } from "@/lib/types";

export const revalidate = 600;

function xmlEscape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

async function fetchJson<T>(path: string, params: Record<string, string> = {}): Promise<T | null> {
  try {
    const url = new URL(env.apiUrl + path);
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
    const res = await fetch(url.toString(), {
      next: { revalidate },
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function GET(): Promise<Response> {
  const [settings, page] = await Promise.all([
    fetchJson<SiteSettings>("/cms/settings/"),
    fetchJson<Paginated<ArticleListItem>>("/articles/", {
      page_size: "20",
      ordering: "-published_at",
    }),
  ]);

  const name = settings?.site_name || "Flash News";
  const home = absoluteUrl("/");
  const self = absoluteUrl("/feed.xml");

  const items = (page?.results ?? [])
    .map((a) => {
      const link = absoluteUrl(`/articles/${a.slug}`);
      const pub = a.published_at ? new Date(a.published_at).toUTCString() : "";
      return `    <item>
      <title>${xmlEscape(a.title)}</title>
      <link>${xmlEscape(link)}</link>
      <guid isPermaLink="true">${xmlEscape(link)}</guid>
      <dc:creator>${xmlEscape(a.author.full_name || a.author.username)}</dc:creator>
      <category>${xmlEscape(a.category.name)}</category>
      ${pub ? `<pubDate>${pub}</pubDate>` : ""}
      <description>${xmlEscape(a.excerpt || "")}</description>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${xmlEscape(name)} — Latest</title>
    <link>${xmlEscape(home)}</link>
    <atom:link href="${xmlEscape(self)}" rel="self" type="application/rss+xml" />
    <description>${xmlEscape(settings?.about_us || "The latest stories.")}</description>
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=600, s-maxage=600, stale-while-revalidate=1200",
    },
  });
}
