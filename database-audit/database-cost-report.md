# Database Cost Report

Maps each database workload to the hosting-cost dimension it drives (I/O, CPU,
RAM, connections, bandwidth) and estimates the savings from the applied fixes.

Costs on a single-VPS Postgres deployment scale with: **rows read × query
frequency** (I/O + CPU), **connection setup rate** (CPU), **bytes serialized ×
requests** (bandwidth + app CPU/RAM), and **rows written × frequency** (I/O +
WAL + vacuum).

---

## 1. Major sources of database I/O — reads

| Source | Frequency | Before | After |
|---|---|---|---|
| Article list (home, category, feed, mobile) | **Very high** | 23 queries/req (20 count N+1) | **3** warm / 8 cold |
| Comment thread | High | 23 queries/req (30 count N+1) | **3** |
| Category list (nav on every page shell) | High | 7 queries/req | **2** |
| Full-text search | Medium (throttled) | FTS query ×3 | FTS query ×2 |
| Aggregation admin list | Low (staff) | 1 + N (imported_article) | 1 |

The article/comment N+1 removals are the headline win: on a page that renders,
say, the home feed plus 6 category sections, the article-list count queries alone
dropped from **~160 aggregate queries to ~0** (warm cache) per full render cycle.

## 2. High-frequency reads

- **`Category` article counts** were previously recomputed on every serialized
  category (thousands of times per minute under load). Now computed once per
  category and cached until the category's article set changes → effectively a
  constant, not a per-request cost.
- **`SiteSetting` / category nav / active ads** are read on virtually every page.
  The frontend already ISR-caches these (revalidate 15–120s), so backend hit rate
  is bounded by the revalidation window, not raw traffic. (See caching report for
  a backend-side `SiteSetting` cache recommendation.)

## 3. High-frequency writes (the remaining top cost driver)

| Write | Trigger | Volume |
|---|---|---|
| `Article.views += 1` | every article view | **≈ 1 write per pageview** |
| `Advertisement.impressions/clicks += 1` | every ad render/click | very high |
| `PageView` INSERT | every analytics beacon | very high (append-only) |
| `SearchQueryLog` INSERT | every search | medium |
| `Comment.report_count += 1`, `Poll` votes | occasional | low |

**This is now the largest DB cost surface.** Each is a single-row write, but at
news-site traffic the view/impression counters and the `PageView` stream dominate
write I/O, WAL, and autovacuum. **Recommendation (R1 in the perf report):** buffer
counter increments in Redis and flush aggregated deltas on a Celery beat tick
(e.g. one `UPDATE … SET views = views + :delta` per article per minute instead of
one per view). This can cut counter-write volume by 100–1000×. Not applied
(introduces eventual consistency on counters).

For `PageView`, the nightly `aggregate_daily_analytics` rollup already exists;
consider partitioning `PageView` by month and dropping/archiving old partitions to
cap storage.

## 4. Large payloads (bandwidth + app CPU/RAM + mobile data)

- **Article cards** embed the full `CategorySerializer` (SEO fields, description,
  image) per row though clients use only `name`/`slug` — see R3. Trimming to a
  mini serializer would cut the largest list payload meaningfully (mobile data
  cost).
- **Gallery list** returns every image of every gallery (R4).
- **Aggregation list** correctly excludes the large `content` body from list rows
  (only `retrieve` includes it) — already good.

## 5. Connection cost

`CONN_MAX_AGE=60` now reuses connections instead of a fresh
connect+auth per request. On a busy API this removes thousands of connection
handshakes per minute — direct CPU savings on the Postgres box and lower
tail latency. Pair with PgBouncer when concurrency grows.

## 6. Storage

- `PageView` / `SearchQueryLog` are append-only and unbounded — the main storage
  growth. Rollup exists; add retention/partitioning as above.
- `ArticleRevision` stores a full content snapshot per save (chosen for simple
  restores). Fine, but a busy editing workflow grows it quickly — consider a
  retention cap (keep last N revisions) if storage matters.
- Redundant indexes (index report) consume storage and write I/O; dropping the
  four listed reclaims a little of both.

---

## Estimated hosting-cost effect

Rough, order-of-magnitude (actual depends on traffic mix):

| Lever | Effect |
|---|---|
| N+1 removal on article/comment/category lists | **−80–90% read queries** on the top-3 endpoints → large drop in DB CPU + I/O, the dominant read cost |
| Persistent connections | Lower DB CPU (no per-request auth), lower latency |
| Search single-count | −1 expensive FTS execution per search |
| **Recommended** counter buffering (R1) | Potentially **−90%+ write I/O** on the busiest write path |
| **Recommended** payload trimming (R3/R4) | Lower egress bandwidth + mobile data |

The applied changes attack the biggest **read** cost with zero behaviour change.
The biggest **write** cost (counter amplification) is documented with a concrete,
safe implementation path but left unimplemented because it trades exact-time
counter accuracy for throughput — a product decision.
