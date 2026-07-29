# First-party analytics: from raw events to a dashboard

Every product eventually needs to answer: *how many people visited? what did
they read? are the ads working?* You can bolt on Google Analytics — and Flash
does load a GA tag when configured — but a **first-party** analytics store (data
you collect and own) gives you numbers that survive ad-blockers, respect
privacy, and can be joined to your own tables (which article? which ad?).

This lesson explains the ideas behind the `/dashboard/analytics` page; the
[file explainers](README.md) walk the code (`apps/analytics` on the backend, the
tracker + dashboard on the frontend).

## 1. The shape of an analytics system: collect → store → aggregate → show

```mermaid
flowchart LR
  V[Visitor's browser] -- pageview beacon --> I[Ingest API<br/>/analytics/pageview/]
  A[Ad on the page] -- impression/click --> AD[Ads API<br/>/ads/id/impression|click/]
  I --> PV[(PageView<br/>raw events)]
  AD --> ADS[(Advertisement<br/>counters)]
  PV --> S[dashboard_summary&#40;days&#41;<br/>aggregate queries]
  ADS --> S
  SQ[(SearchQueryLog)] --> S
  S --> D[Analytics dashboard<br/>tiles · chart · tables]
```

Four stages, and each is a deliberate design choice:

1. **Collect** — the browser sends small "beacons" (a pageview when you read a
   page, a ping when an ad is shown or clicked). Collection lives on the
   *client* because only the browser knows what actually rendered.
2. **Store** — cheap, append-only rows (`PageView`) plus running counters on the
   ad rows. Writing is fast and never blocks the page.
3. **Aggregate** — turn thousands of raw rows into a handful of numbers with
   `GROUP BY` queries (`dashboard_summary`).
4. **Show** — a staff-only page renders tiles, a trend chart and tables.

## 2. Counting *visitors* without cookies or PII

A **pageview** is easy: one row per page read. A **visitor** is harder — you must
recognise "the same person" across several pages without tracking their
identity. The privacy-friendly trick is an **anonymous session id**: a random
string the browser generates once and keeps in `localStorage`. It's not a name,
email or IP — just a coin-flip label. Unique visitors ≈ number of distinct
session ids:

```sql
SELECT COUNT(DISTINCT session_key) FROM analytics_pageview WHERE created_at >= :since;
```

That's why `PageView.session_key` exists and why the client sends the same
`flash_sid` on every beacon. Because it's random and cookie-free, it's honest
about being an *estimate* (clearing storage starts a new "visitor"), which is a
fair trade for not tracking people.

## 3. Dwell time (how long they read)

The client records when a page appears and, when you leave it, sends the elapsed
seconds as `read_seconds`. Averaging that column is your "avg. read time" — a
proxy for engagement. The subtlety is *when* to send: a single-page-app doesn't
fire a normal page unload on in-app navigation, so the tracker sends on **route
change** and also on `visibilitychange`/`pagehide` for the final page. See
[tracking-explained.md](project-files/tracking-explained.md).

## 4. Traffic sources from the referrer

When a browser follows a link it sends a `Referer` header (yes, misspelled in
the HTTP spec). The ingest view buckets it into `direct` / `search` / `social` /
`referral` by matching the host against known engines and networks. Storing the
*bucket* (not the raw URL) keeps reporting cheap and avoids logging sensitive
query strings.

## 5. Ad metrics: impressions, clicks, CTR

- **Impression** — the ad was shown. Fired once when the ad mounts.
- **Click** — the ad was clicked. Fired on the outbound link.
- **CTR (click-through rate)** — `clicks / impressions`, the single most
  important ad-effectiveness number. Flash stores it *nowhere*: it's computed on
  read (`_ctr`) so it can never disagree with the counters. (Same "derive, don't
  store" reasoning as the article's reading time.)

Flash increments two counters on the ad row with an atomic `F()` expression, so
two simultaneous clicks can't clobber each other:

```python
Advertisement.objects.filter(pk=pk).update(clicks=F("clicks") + 1)
```

Because they're plain counters, ad numbers are **lifetime** totals (there's no
per-event ad log), which is why the dashboard labels them "lifetime" — being
honest about what a number means is part of good analytics.

## 6. Raw events vs. rollups (why both exist)

Querying millions of raw `PageView` rows on every dashboard load gets slow. The
classic fix is a **rollup**: a nightly job collapses each day into one
`DailyStat` row, and the dashboard reads those. Flash ships the rollup task
(`aggregate_daily_analytics`) *and* computes the dashboard live from raw events —
live is simpler and fine at small scale, and it keeps working without Celery
running in dev. The `dashboard_summary` function is written so it could be
swapped to read `DailyStat` later without changing the API or the UI. **Design
for the scale you have, leave a door open for the scale you'll get.**

---

## Exercises

**Beginner**
1. Add a "bounce rate" tile: the % of sessions with exactly one pageview. Which
   table has the data, and what does the query group by?
2. The dashboard shows `avg_read_seconds`. Why is a raw *average* misleading if a
   few readers leave a tab open for hours? Propose a more robust statistic.

**Intermediate**
3. Add a `device` bucket (mobile/desktop) to `PageView`, set from the client, and
   surface a "by device" breakdown — mirror how `source` already flows through.
4. `_top_articles` parses the slug out of the path. What breaks if the public
   article URL changes to `/story/<slug>`? Make the prefix configurable and add a
   test.

**Advanced**
5. Switch `dashboard_summary`'s time series to read from `DailyStat` when the
   window is older than today, falling back to raw events for today. Keep the
   response shape identical so the frontend doesn't change.
6. The session-id method counts a returning visitor who cleared storage as new.
   Sketch two ways to reduce that error and the privacy cost of each.

## Quiz

1. Why store `session_key` instead of an IP address or a user id?
2. What does CTR measure, and why isn't it stored as a column?
3. Give one reason dwell time is sent on `visibilitychange`, not only on unload.
4. What's the trade-off between computing the dashboard from raw events vs a
   `DailyStat` rollup?
5. Why are ad totals "lifetime" while pageviews respect a date window?

## Interview questions

- **Junior:** What's the difference between a pageview and a unique visitor?
- **Mid:** A stakeholder says visitor counts are ~10% lower than Google
  Analytics. Give three plausible, non-bug reasons.
- **Senior:** Design analytics for 50M pageviews/day. Where do raw events go,
  how do rollups run, and how do you keep the dashboard sub-second? Discuss
  approximate-distinct (HyperLogLog) for unique visitors.

## Answers (selected)

- **Quiz 2:** CTR = clicks ÷ impressions. Deriving it on read means it can never
  drift out of sync with the two counters it depends on.
- **Quiz 5:** Pageviews are timestamped rows you can filter by date; ad counters
  are single running totals with no per-event history, so the only honest thing
  to report is their lifetime value.
- **Exercise 2:** A mean is dragged by outliers (an abandoned tab). Prefer a
  **median** or a capped mean (Flash already caps a single dwell at 3600s).
