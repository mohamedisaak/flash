/**
 * The typed API client for the Django REST API.
 *
 * Design goals:
 * - **One place** that knows how to talk to the backend.
 * - **Build-safe**: every call is wrapped so a failed fetch (e.g. the backend is
 *   down during `next build`) returns an empty/`null` fallback instead of
 *   crashing the build. Pages then render an empty state.
 * - **Caching via Next**: we pass Next's `revalidate` so server components get
 *   Incremental Static Regeneration (ISR) for free.
 *
 * See teaching/12-nextjs/02-config-and-data-fetching.md and
 * teaching/17-react-query/ (client-side fetching).
 */
import { env } from "./env";
import type {
  Advertisement,
  AdPlacement,
  Article,
  ArticleListItem,
  Category,
  FaqItem,
  Paginated,
  PhotoGallery,
  SiteSettings,
  StaticPage,
  Tag,
  Video,
} from "./types";

interface FetchOptions {
  /** ISR window in seconds. 0 = always dynamic (SSR). */
  revalidate?: number;
  searchParams?: Record<string, string | number | undefined>;
}

function buildUrl(path: string, searchParams?: FetchOptions["searchParams"]): string {
  const url = new URL(env.apiUrl + path);
  if (searchParams) {
    for (const [key, value] of Object.entries(searchParams)) {
      if (value !== undefined && value !== "") url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

/** Core fetch: returns parsed JSON, or `null` on any failure (build-safe). */
async function getJson<T>(path: string, opts: FetchOptions = {}): Promise<T | null> {
  try {
    const res = await fetch(buildUrl(path, opts.searchParams), {
      next: { revalidate: opts.revalidate ?? 60 },
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    // Backend unreachable (e.g. during an offline build) — degrade gracefully.
    return null;
  }
}

const EMPTY_PAGE: Paginated<never> = { count: 0, next: null, previous: null, results: [] };

export const api = {
  async listArticles(params?: FetchOptions["searchParams"]): Promise<Paginated<ArticleListItem>> {
    return (
      (await getJson<Paginated<ArticleListItem>>("/articles/", {
        revalidate: 60,
        searchParams: params,
      })) ?? EMPTY_PAGE
    );
  },

  async getArticle(slug: string): Promise<Article | null> {
    return getJson<Article>(`/articles/${slug}/`, { revalidate: 300 });
  },

  async listCategories(): Promise<Category[]> {
    // Short-ish cache so admin changes to category order/names show quickly.
    // page_size=100 (the API max) so ALL categories come back in one page —
    // otherwise the default 20-per-page limit truncates large child lists like
    // the 47 counties, and the nav only shows the first ~13 of them.
    const page = await getJson<Paginated<Category>>("/categories/", {
      revalidate: 120,
      searchParams: { page_size: 100 },
    });
    return page?.results ?? [];
  },

  async getCategory(slug: string): Promise<Category | null> {
    return getJson<Category>(`/categories/${slug}/`, { revalidate: 3600 });
  },

  async articlesInCategory(slug: string): Promise<Paginated<ArticleListItem>> {
    return (
      (await getJson<Paginated<ArticleListItem>>("/articles/", {
        revalidate: 60,
        searchParams: { category: slug },
      })) ?? EMPTY_PAGE
    );
  },

  /** JSON-LD for an article, built server-side by the backend's SEO app. */
  async getArticleJsonLd(slug: string): Promise<Record<string, unknown> | null> {
    return getJson<Record<string, unknown>>(`/seo/articles/${slug}/`, { revalidate: 300 });
  },

  /** Most-viewed articles (for the "Popular" sidebar widget). */
  async listPopular(limit = 5): Promise<ArticleListItem[]> {
    const page = await getJson<Paginated<ArticleListItem>>("/articles/", {
      revalidate: 300,
      searchParams: { ordering: "-views", page_size: limit },
    });
    return page?.results ?? [];
  },

  async listTags(): Promise<Tag[]> {
    const page = await getJson<Paginated<Tag>>("/tags/", {
      revalidate: 3600,
      searchParams: { page_size: 40 },
    });
    return page?.results ?? [];
  },

  async articlesByAuthor(authorId: number): Promise<Paginated<ArticleListItem>> {
    return (
      (await getJson<Paginated<ArticleListItem>>("/articles/", {
        revalidate: 120,
        searchParams: { author: authorId, page_size: 24 },
      })) ?? EMPTY_PAGE
    );
  },

  async listVideos(): Promise<Video[]> {
    const page = await getJson<Paginated<Video>>("/videos/", {
      revalidate: 300,
      searchParams: { page_size: 12 },
    });
    return page?.results ?? [];
  },

  async listGalleries(): Promise<PhotoGallery[]> {
    const page = await getJson<Paginated<PhotoGallery>>("/galleries/", {
      revalidate: 300,
      searchParams: { page_size: 24 },
    });
    return page?.results ?? [];
  },

  async getGallery(slug: string): Promise<PhotoGallery | null> {
    return getJson<PhotoGallery>(`/galleries/${slug}/`, { revalidate: 300 });
  },

  /** Global site settings (singleton) — site name, contact info, footer blurb.
   *  Short cache so admin theme/settings edits show up quickly. */
  async getSiteSettings(): Promise<SiteSettings | null> {
    return getJson<SiteSettings>("/cms/settings/", { revalidate: 15 });
  },

  /** An editable static page (about/contact/terms/privacy/…) by its key.
   *  Short cache so admin content edits show up quickly. */
  async getStaticPage(key: string): Promise<StaticPage | null> {
    const page = await getJson<Paginated<StaticPage>>("/cms/pages/", {
      revalidate: 60,
      searchParams: { key },
    });
    const p = page?.results?.[0];
    return p && p.is_active ? p : null;
  },

  /** Active FAQ entries (question/answer), ordered. */
  async listFaqs(): Promise<FaqItem[]> {
    const page = await getJson<Paginated<FaqItem>>("/cms/faqs/", {
      revalidate: 300,
      searchParams: { is_active: "true", page_size: 100 },
    });
    return page?.results ?? [];
  },

  /** Active ads for a placement slot (header/sidebar/in_content/…).
   *  Short cache so admin ad edits (image, overlay, effect) show up quickly. */
  async listAds(placement: AdPlacement): Promise<Advertisement[]> {
    const page = await getJson<Paginated<Advertisement>>("/ads/", {
      revalidate: 15,
      searchParams: { placement, is_active: "true", page_size: 5 },
    });
    return page?.results ?? [];
  },
};
