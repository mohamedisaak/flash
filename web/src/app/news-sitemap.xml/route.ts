/**
 * Google News sitemap for the PUBLIC site domain.
 *
 * Google News uses a dedicated sitemap with the `news:` namespace and only
 * cares about articles from roughly the last 48 hours (its crawl window). We
 * generate it here so the URLs match the canonical frontend routes and live on
 * the public origin the News crawler fetches.
 *
 * Route handlers can't use the Metadata sitemap object (which lacks the `news:`
 * extension), so we emit the XML directly. See teaching/23-seo/03-sitemaps-and-robots.md.
 */
import { env } from "@/lib/env";
import { absoluteUrl } from "@/lib/seo";
import type { ArticleListItem, Paginated, SiteSettings } from "@/lib/types";

export const revalidate = 300; // freshness matters for News — refresh every 5 min

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
      page_size: "100",
      ordering: "-published_at",
    }),
  ]);

  const publication = settings?.site_name || "Flash News";
  const cutoff = Date.now() - 48 * 60 * 60 * 1000;
  const recent = (page?.results ?? []).filter(
    (a) => a.published_at && new Date(a.published_at).getTime() >= cutoff,
  );

  const urls = recent
    .map((a) => {
      const loc = absoluteUrl(`/articles/${a.slug}`);
      return `  <url>
    <loc>${xmlEscape(loc)}</loc>
    <news:news>
      <news:publication>
        <news:name>${xmlEscape(publication)}</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${a.published_at}</news:publication_date>
      <news:title>${xmlEscape(a.title)}</news:title>
    </news:news>
  </url>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${urls}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
