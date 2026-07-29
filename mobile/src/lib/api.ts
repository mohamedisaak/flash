/**
 * Typed client for the Django REST API — the mobile app talks to the exact same
 * endpoints as the website. Errors throw so TanStack Query can surface them as
 * retry/error states. See teaching/22-mobile-architecture/.
 */
import { env } from "./env";
import type { Article, ArticleListItem, Category, Paginated, Video } from "./types";

type Params = Record<string, string | number | undefined>;

function qs(params?: Params): string {
  if (!params) return "";
  const parts = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== "")
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
  return parts.length ? `?${parts.join("&")}` : "";
}

async function getJson<T>(path: string, params?: Params): Promise<T> {
  const res = await fetch(`${env.apiUrl}${path}${qs(params)}`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return (await res.json()) as T;
}

export const api = {
  listArticles: (params?: Params) =>
    getJson<Paginated<ArticleListItem>>("/articles/", {
      ordering: "-published_at",
      page_size: 20,
      ...params,
    }),

  getArticle: (slug: string) => getJson<Article>(`/articles/${slug}/`),

  listCategories: async (): Promise<Category[]> =>
    (await getJson<Paginated<Category>>("/categories/", { page_size: 100 })).results,

  articlesInCategory: (slug: string) =>
    getJson<Paginated<ArticleListItem>>("/articles/", { category: slug, page_size: 30 }),

  search: (q: string) => getJson<Paginated<ArticleListItem>>("/search/", { q }),

  listVideos: async (): Promise<Video[]> =>
    (await getJson<Paginated<Video>>("/videos/", { page_size: 20 })).results,
};
