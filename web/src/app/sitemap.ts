/**
 * XML sitemap for the PUBLIC site domain.
 *
 * Next serves this at `/sitemap.xml`. It enumerates only routes that actually
 * exist on the frontend — home, sections, articles, author profiles, the
 * gallery/FAQ landing pages, and the editable static pages — each with a
 * `lastModified` so crawlers refresh changed content quickly. Private routes
 * (dashboard, auth) and the thin `/search` page are intentionally excluded
 * (see robots.ts). Videos/galleries have no per-item frontend route yet, so
 * their detail URLs are deliberately not listed (they'd be soft-404s).
 *
 * Data is pulled from the REST API; if the backend is unreachable at build time
 * the sitemap degrades to the static routes rather than failing the build.
 * See teaching/23-seo/03-sitemaps-and-robots.md.
 */
import type { MetadataRoute } from "next";
import { env } from "@/lib/env";
import { absoluteUrl } from "@/lib/seo";
import type { ArticleListItem, Category, Paginated } from "@/lib/types";

export const revalidate = 3600; // rebuild the sitemap at most hourly

// Editable page keys that resolve to /pages/<key> (mirrors the route's
// generateStaticParams). `/faq` is its own top-level route, added separately.
const STATIC_PAGE_KEYS = ["about", "contact", "terms", "privacy", "disclaimer"];

const MAX_ARTICLES = 5000; // cap; split via generateSitemaps if this is exceeded

async function fetchJson<T>(path: string, params: Record<string, string>): Promise<T | null> {
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

/** Walk paginated results up to `cap` items. */
async function collectArticles(): Promise<ArticleListItem[]> {
  const out: ArticleListItem[] = [];
  for (let page = 1; out.length < MAX_ARTICLES; page++) {
    const data = await fetchJson<Paginated<ArticleListItem>>("/articles/", {
      page: String(page),
      page_size: "100",
      ordering: "-published_at",
    });
    if (!data || data.results.length === 0) break;
    out.push(...data.results);
    if (!data.next) break;
  }
  return out.slice(0, MAX_ARTICLES);
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), lastModified: now, changeFrequency: "hourly", priority: 1 },
    {
      url: absoluteUrl("/photo-gallery"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.5,
    },
    {
      url: absoluteUrl("/video-gallery"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.5,
    },
    { url: absoluteUrl("/faq"), lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    ...STATIC_PAGE_KEYS.map((key) => ({
      url: absoluteUrl(`/pages/${key}`),
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.3,
    })),
  ];

  const [categoriesPage, articles] = await Promise.all([
    fetchJson<Paginated<Category>>("/categories/", { page_size: "100", is_active: "true" }),
    collectArticles(),
  ]);

  const categoryEntries: MetadataRoute.Sitemap = (categoriesPage?.results ?? []).map((c) => ({
    url: absoluteUrl(`/${c.slug}`),
    lastModified: now,
    changeFrequency: "daily",
    priority: 0.7,
  }));

  const articleEntries: MetadataRoute.Sitemap = articles.map((a) => ({
    url: absoluteUrl(`/articles/${a.slug}`),
    lastModified: a.published_at ? new Date(a.published_at) : now,
    changeFrequency: "daily",
    priority: a.is_featured || a.is_breaking ? 0.9 : 0.8,
  }));

  // Author profile pages — one per distinct author who has published articles.
  const authorIds = new Map<number, string | null>();
  for (const a of articles) if (!authorIds.has(a.author.id)) authorIds.set(a.author.id, a.published_at);
  const authorEntries: MetadataRoute.Sitemap = Array.from(authorIds.entries()).map(([id, pub]) => ({
    url: absoluteUrl(`/authors/${id}`),
    lastModified: pub ? new Date(pub) : now,
    changeFrequency: "weekly",
    priority: 0.4,
  }));

  return [...staticEntries, ...categoryEntries, ...articleEntries, ...authorEntries];
}
