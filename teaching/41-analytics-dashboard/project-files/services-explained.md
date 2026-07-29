# `apps/analytics/services.py` — the dashboard computations, explained

## Why it exists

The analytics dashboard needs a dozen different numbers (visitors, pageviews,
dwell, sources, top stories, top searches, ad performance). Putting all that SQL
in the *view* would make it untestable and tangled with HTTP concerns. This
module is the **pure computation layer**: give it a window of days, get back a
plain dict. The view is then a five-line wrapper, and every number can be
asserted in a unit test without a request.

## What problem it solves

Turning **raw, high-volume event rows into a small summary** is the core of any
analytics feature. Doing it well means: one query per metric (not N+1), guarding
divide-by-zero, filling gaps in a time series, and being honest about which
numbers are windowed vs lifetime.

## How it works

`dashboard_summary(days)` computes a `since` cutoff (midnight, `days-1` ago so
"7 days" includes today), filters `PageView` once, and hands that queryset to
small helpers:

- **`_timeseries`** — `GROUP BY TruncDate(created_at)` for daily pageviews and
  `COUNT(DISTINCT session_key)` visitors, then **zero-fills** every day in the
  range in Python so the chart has no gaps (a `GROUP BY` only returns days that
  had traffic; a chart needs all of them).
- **`_top_articles`** — filters paths that start with `/articles/`, groups by
  path, and resolves each slug → title in **one** extra query
  (`slug__in=[…]`), not one per row. This is why the tracker only needs to send
  a `path`: the article is recovered server-side from the URL.
- **`_top_searches`** — groups `SearchQueryLog` by `query`, with an average of
  `results_count` so you can spot searches that return nothing (a content gap).
- **`_sources`** — groups the coarse `source` bucket the ingest view already
  derived from the referrer.
- **`_ads`** — reads the ads' running counters: overall totals, a per-creative
  list (ranked by clicks), and a per-placement rollup, each with a derived
  `_ctr`.

`_ctr(clicks, impressions)` is the one piece of shared arithmetic — it returns
`0.0` when impressions are zero rather than raising `ZeroDivisionError`.

## How it interacts with other files

- `models.py` → reads `PageView` and `SearchQueryLog`.
- `apps/ads/models.py` → reads `Advertisement.impressions/clicks`.
- `apps/articles`, `apps/newsletters`, `apps/accounts` → cross-app **reads** for
  the content tiles. Reads across apps are fine; the modular-monolith rule
  forbids cross-app *model imports for writes/relations*, not read-only counts.
- `views.py` → `AnalyticsDashboardView` clamps `days` to 1–365 and returns this
  dict. `analytics-api.ts` on the frontend mirrors the shape as a TypeScript
  `AnalyticsSummary`.

## Common mistakes

- **Forgetting to zero-fill the time series** → a line chart with holes, or
  worse, dates plotted unevenly. Always materialise every bucket.
- **N+1 title lookups** in `_top_articles` — resolving slugs one row at a time
  would issue a query per article. Batch with `slug__in`.
- **Dividing by zero** for CTR on an ad that's never been shown.
- **Mixing windowed and lifetime numbers silently.** Pageviews respect `days`;
  ad counters don't. The dict keeps them in separate places and the UI labels
  ad tiles "lifetime" so nobody misreads them.
- **Trusting `created_at` is auto-set in tests.** `PageView.objects.create` sets
  it to now; to test an *old* event you must `.update(created_at=…)` (which
  bypasses `auto_now_add`).

## Best practices shown here

- Computation isolated from the view → trivially unit-testable (see
  `tests/test_dashboard.py`).
- One aggregate query per metric; batch the lookups you can't aggregate.
- Derived metrics (CTR) computed on read, never stored.
- A summary shape designed so it could later read the `DailyStat` rollup without
  changing the API contract.

## Where to go next

- [tracking-explained.md](tracking-explained.md) — how the raw events this file
  reads actually get written by the browser.
- [analytics-tables.md](../../30-database-design/analytics-tables.md) — the
  `PageView` / `SearchQueryLog` / `DailyStat` schema.
- [01-first-party-analytics.md](../01-first-party-analytics.md) — the concepts.
