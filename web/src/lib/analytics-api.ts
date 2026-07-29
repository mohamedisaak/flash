/**
 * Typed client for the staff analytics dashboard API (`/analytics/dashboard/`).
 *
 * Staff-only; goes through `apiRequest` (attaches + refreshes the JWT). The
 * backend computes everything in `apps/analytics/services.py`. See
 * teaching/41-analytics-dashboard/.
 */
import { apiRequest } from "./auth-api";

export interface TimePoint {
  date: string;
  pageviews: number;
  visitors: number;
}

export interface SourceRow {
  source: string;
  count: number;
}

export interface TopArticle {
  slug: string;
  title: string;
  path: string;
  views: number;
  visitors: number;
}

export interface TopSearch {
  query: string;
  count: number;
  avg_results: number;
}

export interface AdRow {
  id: number;
  name: string;
  placement: string;
  is_active: boolean;
  impressions: number;
  clicks: number;
  ctr: number;
}

export interface PlacementRow {
  placement: string;
  impressions: number;
  clicks: number;
  ctr: number;
}

export interface AnalyticsSummary {
  range_days: number;
  since: string;
  until: string;
  totals: {
    pageviews: number;
    visitors: number;
    avg_read_seconds: number;
    ad_impressions: number;
    ad_clicks: number;
    ad_ctr: number;
    articles_published: number;
    articles_total: number;
    subscribers: number;
    authors: number;
  };
  timeseries: TimePoint[];
  sources: SourceRow[];
  top_articles: TopArticle[];
  top_searches: TopSearch[];
  ads: {
    impressions: number;
    clicks: number;
    ctr: number;
    by_ad: AdRow[];
    by_placement: PlacementRow[];
  };
}

export const analyticsApi = {
  dashboard: (days: number) => apiRequest<AnalyticsSummary>(`/analytics/dashboard/?days=${days}`),
};
