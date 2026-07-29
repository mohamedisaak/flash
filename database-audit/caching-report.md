# Caching Report

The stack has three cache layers: **Next.js ISR** (frontend server components),
**TanStack Query** (client/mobile), and **Django cache** (Redis in prod,
local-memory in dev). This audit added one targeted Django-cache use and
documents the remaining high-value opportunities.

---

## Applied

### Category article counts (Django cache + signal invalidation)
- **File:** `apps/categories/services.py`, `apps/categories/signals.py`.
- **What:** `article_count` for a category is cached (`cat_article_count_<id>`,
  600s TTL) and invalidated by `post_save`/`post_delete` on `Article`.
- **Why it's safe to cache:** the value is a display counter; invalidation on the
  ORM write paths that change category membership keeps it exact, and the TTL is
  only a backstop for edge cases (re-categorising an article invalidates the new
  section immediately, the old one within the TTL).
- **Benefit:** eliminates the per-serialized-row `COUNT(*)` on the busiest
  endpoints (measured 23 → 3 queries on the article list). The standalone
  `/categories/` endpoint bypasses the cache entirely via a one-query annotation.

---

## Recommended (not applied)

Ordered by benefit-to-effort.

### C1 — `SiteSetting` singleton
- **Now:** `SiteSetting.load()` → `get_or_create(pk=1)` on every `/cms/settings/`
  GET.
- **Recommendation:** cache the serialized settings under `site_settings` with
  invalidation in `SiteSetting.save()` (the model already funnels through a
  singleton). Read on nearly every page → high hit rate, trivial to make correct
  (single writer).
- **Expected:** one guaranteed query per page-shell render removed backend-side
  (already softened by frontend ISR, but this helps non-ISR/mobile callers).

### C2 — Analytics dashboard summary
- **Now:** `analytics.services.dashboard_summary(days)` runs ~8 aggregates + a
  time-series group each call; `cms.DashboardStatsView` runs 10 counts.
- **Recommendation:** cache `dashboard_summary` under
  `analytics_dashboard_<days>` with a 5–15 min TTL, and the stats tiles under
  `dashboard_stats` similarly. These are staff dashboards where minute-scale
  staleness is fine.
- **Expected:** turns a heavy multi-aggregate request into an occasional one;
  protects the DB if the dashboard is left open/auto-refreshing.

### C3 — Active ads per placement
- **Now:** `GET /ads/?placement=…&is_active=true` per placement; frontend ISR
  caches 15s.
- **Recommendation:** if ad rendering moves to a client/mobile path without ISR,
  cache the active-ads-by-placement list (short TTL, invalidate on ad save). Low
  priority while ISR covers it.

### C4 — Public article detail
- **Now:** `getArticle` is ISR-cached 300s on web. Mobile
  (`getArticle`) has only TanStack `staleTime` 60s.
- **Recommendation:** consider a short backend cache (or DRF conditional
  requests / ETag) for `GET /articles/{slug}/` so repeated mobile fetches of a
  hot story don't re-hit the DB. Pair with the existing `register_view` write
  path (which is separate and shouldn't be cached).

---

## Frontend / mobile cache posture (already good)

- **Next.js:** every `api.*` server call passes `next: { revalidate }` (15s for
  volatile settings/ads, 60s for feeds, 300–3600s for stable
  categories/tags/articles). This is correct ISR usage and already shields the
  backend from raw read traffic.
- **TanStack Query:** web `providers.tsx` sets `staleTime: 30_000` +
  `refetchOnWindowFocus: false`; mobile `_layout.tsx` sets `staleTime: 60_000`,
  `retry: 1`. Sensible — avoids refetch storms and focus-refetch duplication.
- **No polling loops** found in web/mobile (live coverage would poll, but no
  aggressive interval is configured). Good.

**One caveat:** the home page fans out one article-list request **per top-level
category** (`Promise.all(topCats.map(...))`). ISR caches each, so it's bounded,
but combined with the (now-fixed) article-list N+1 it was a multiplier. With the
N+1 gone, each section request is 3 queries; fine. If category count grows large,
consider a single `/articles/?featured_by_category` style endpoint to collapse the
fan-out.

---

## Invalidation strategy summary

| Cache | Invalidation | Staleness risk |
|---|---|---|
| Category article count | signal on Article save/delete (+600s TTL) | none in practice; ≤600s only for rare re-categorisation of the *old* section |
| SiteSetting (rec.) | on `SiteSetting.save()` | none (single writer) |
| Dashboard summary (rec.) | TTL only | ≤15 min, acceptable for staff |
| Active ads (rec.) | on ad save (+ short TTL) | seconds |

Principle followed: **only cache where invalidation is cheap and correct, or
where bounded staleness is acceptable for the data's purpose.** No cache was
added to a value that drives business logic or must be exact in real time.
