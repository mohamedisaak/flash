# 41 · Analytics Dashboard

How Flash measures its own audience and ad performance — the `apps/analytics`
event store + `dashboard_summary` aggregation on the backend, the client-side
pageview/ad instrumentation on the public site, and the staff-only
`/dashboard/analytics` page (visitor & pageview tiles, a daily trend chart,
traffic sources, most-read stories, top searches, and ad CTR).

This is **first-party** analytics: data we collect and own, cookie-free and
privacy-friendly, complementing the optional Google Analytics tag.

## Lessons

1. [First-party analytics](01-first-party-analytics.md) — the concepts: the
   collect → store → aggregate → show pipeline, counting unique visitors with an
   anonymous session id, dwell time, traffic sources, ad CTR, and raw-events vs
   rollups; diagram, exercises, quiz, interview questions.

## File-paired explainers

- [services-explained.md](project-files/services-explained.md) —
  `dashboard_summary` and the aggregation queries behind every number.
- [tracking-explained.md](project-files/tracking-explained.md) — the client
  instrumentation: the beacon helper, the pageview tracker, and the ad pings.

## Related

- [30-database-design/analytics-tables.md](../30-database-design/analytics-tables.md)
  — the `PageView` / `SearchQueryLog` / `DailyStat` schema.
- [09-celery](../09-celery/) — the nightly `aggregate_daily_analytics` rollup.
- [12-nextjs/project-files/ad-tsx-explained.md](../12-nextjs/project-files/ad-tsx-explained.md)
  — the ad component the impression/click pings hook into.
- [12-nextjs/07-dashboard-and-forms.md](../12-nextjs/07-dashboard-and-forms.md) —
  the dashboard patterns the analytics page builds on.
