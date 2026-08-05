/**
 * Typed client for the news-aggregation admin API (`/aggregation/…`).
 *
 * All endpoints are staff-only and go through `apiRequest`, which attaches the
 * JWT and transparently refreshes it. See the backend in
 * `apps/aggregation/views.py` and teaching/40-news-aggregation/.
 */
import { apiRequest } from "./auth-api";
import type { Category, Paginated } from "./types";

export type SourceRegion = "kenya" | "international" | "global";

export interface IngestSource {
  slug: string;
  name: string;
  kind: "rss" | "api";
  region: SourceRegion;
  homepage: string;
  requires_key: boolean;
  available: boolean;
  paywalled: boolean;
  count: number;
}

export interface IngestCategory {
  slug: string;
  label: string;
}

export interface AggItem {
  id: number;
  source: string;
  source_name: string;
  region: SourceRegion;
  category: string;
  url: string;
  title: string;
  summary: string;
  author: string;
  image_url: string;
  published_at: string | null;
  is_hidden: boolean;
  is_imported: boolean;
  content_fetched: boolean;
  has_content: boolean;
  imported_article_slug: string | null;
  created_at: string;
}

export interface AggItemDetail extends AggItem {
  content: string;
}

export interface RunSummary {
  run_id: number;
  dry_run: boolean;
  sources: string[];
  categories: string[];
  created: number;
  updated: number;
  skipped: number;
  error: number;
  detail: Record<
    string,
    { created: number; updated: number; skipped: number; error: number; message: string }
  >;
}

export interface IngestionRun {
  id: number;
  sources: string[];
  dry_run: boolean;
  created_count: number;
  updated_count: number;
  skipped_count: number;
  error_count: number;
  message: string;
  created_at: string;
}

export interface AggStats {
  total: number;
  hidden: number;
  imported: number;
  by_source: Record<string, number>;
}

export type BulkAction =
  "publish" | "import_draft" | "fetch_content" | "hide" | "unhide" | "delete";

function qs(params: Record<string, string | number | boolean | undefined>): string {
  const u = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") u.set(k, String(v));
  }
  const s = u.toString();
  return s ? `?${s}` : "";
}

export const ingestionApi = {
  sources: () => apiRequest<IngestSource[]>("/aggregation/items/sources/"),
  // Crawlable sections (Sports, Business, …) for category-scoped ingestion.
  crawlCategories: () => apiRequest<IngestCategory[]>("/aggregation/items/categories/"),
  stats: () => apiRequest<AggStats>("/aggregation/items/stats/"),

  // Editorial sections an imported item can be filed under (for the picker).
  categories: () => apiRequest<Paginated<Category>>("/categories/?page_size=100"),

  listItems: (params: {
    source?: string;
    region?: string;
    is_hidden?: boolean;
    search?: string;
    page?: number;
    page_size?: number;
  }) => apiRequest<Paginated<AggItem>>(`/aggregation/items/${qs(params)}`),

  getItem: (id: number) => apiRequest<AggItemDetail>(`/aggregation/items/${id}/`),

  fetchContent: (id: number) =>
    apiRequest<{ has_content: boolean }>(`/aggregation/items/${id}/fetch-content/`, {
      method: "POST",
      body: {},
    }),

  run: (body: {
    sources: string[];
    categories?: string[];
    max_items: number;
    dry_run: boolean;
  }) =>
    apiRequest<RunSummary>("/aggregation/items/run/", { method: "POST", body }),

  bulk: (action: BulkAction, ids: number[], category?: string) =>
    apiRequest<Record<string, number | boolean>>("/aggregation/items/bulk/", {
      method: "POST",
      body: { action, ids, category },
    }),

  itemHide: (id: number, hide: boolean) =>
    apiRequest("/aggregation/items/" + id + (hide ? "/hide/" : "/unhide/"), {
      method: "POST",
      body: {},
    }),

  itemImport: (id: number, publish: boolean, category?: string) =>
    apiRequest(`/aggregation/items/${id}/import/`, { method: "POST", body: { publish, category } }),

  hideSource: (source: string, hide: boolean) =>
    apiRequest(`/aggregation/items/${hide ? "hide-source" : "unhide-source"}/`, {
      method: "POST",
      body: { source },
    }),

  deleteSource: (source: string) =>
    apiRequest<{ deleted: number }>("/aggregation/items/delete-source/", {
      method: "POST",
      body: { source },
    }),

  deleteAll: () =>
    apiRequest<{ deleted: number }>("/aggregation/items/delete-all/", { method: "POST", body: {} }),

  runs: () => apiRequest<Paginated<IngestionRun>>("/aggregation/runs/"),
  clearRuns: () =>
    apiRequest<{ deleted: number }>("/aggregation/runs/clear/", { method: "POST", body: {} }),
};
