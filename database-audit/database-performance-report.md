# Database Performance Report

**Scope:** Full audit of every model, serializer, view/viewset, service, Celery
task, signal, middleware, and the web/mobile API-consumption layers of the Flash
platform (Django 6 + DRF + PostgreSQL, Next.js 16, Expo/React Native).

**Ground rule honoured:** no application behaviour or API contract was changed.
All 72 backend tests pass before and after. Every payload field that existed
before still exists with the same meaning; only the number of SQL statements
behind them changed.

**Stack confirmed:** Django 6.0.7 / DRF 3.16 / `psycopg` 3 / PostgreSQL, Celery
5 (Redis broker + beat), `django-filter`, `drf-spectacular`, SimpleJWT. Cache:
Redis when `REDIS_URL` is set, else local-memory. No connection pooler.

---

## Measured impact (real numbers)

Query counts captured with `CaptureQueriesContext` against the DRF endpoints,
seeded with representative data (20 articles across 5 categories; 30 comments;
5 categories):

| Endpoint | Before | After (warm cache) | After (cold cache) | Reduction |
|---|---:|---:|---:|---:|
| `GET /api/v1/articles/` (20 rows) | **23** | **3** | 8 | **−87%** |
| `GET /api/v1/comments/?article=` (30 rows) | **23** | **3** | 3 | **−87%** |
| `GET /api/v1/categories/` (5 rows) | **7** | **2** | 2 | **−71%** |

The article and comment lists are the highest-traffic endpoints (public website
home page, every category page, every article page's comment thread, and the
mobile app's main feed all hit them). The article list was previously issuing
**one `SELECT COUNT(*)` per row** on top of the base query — a textbook N+1.

---

## Findings

Severity: **P1** = high-traffic hot path, **P2** = moderate, **P3** = low / admin-only.

### P1-1 — `article_count` N+1 on every article & video card ✅ FIXED

- **Where:** `apps/categories/serializers.py` — `article_count =
  IntegerField(source="articles.count")`.
- **Why expensive:** `CategorySerializer` is **nested inside**
  `ArticleListSerializer`, `ArticleDetailSerializer`, and `VideoSerializer`.
  `articles.count` triggers a `SELECT COUNT(*) FROM articles WHERE category_id=…`
  for **every serialized row**. A 20-item article page = 20 extra count queries,
  each scanning the articles table by category. The home page fans out one
  article-list request per section, multiplying this further.
- **Impact:** ~20 needless aggregate queries per list request on the busiest
  endpoints → measured **23 → 3** queries (warm).
- **Fix:** `article_count` is now a `SerializerMethodField` backed by
  `apps/categories/services.py`:
  - The standalone `/categories/` endpoint annotates `Count("articles")` once
    (one grouped query for the whole page) — always exact.
  - The nested case serves the count from cache; a `post_save`/`post_delete`
    signal on `Article` (`apps/categories/signals.py`) busts the affected
    category so the number stays correct. A 600s TTL is a backstop only.
- **Correctness:** counts all articles of a category (all statuses), identical to
  the old `articles.count`. Signals fire on the ORM `save()`/`delete()` paths
  that change category membership; bulk status flips (e.g. scheduled→published)
  don't change the count and correctly don't invalidate.

### P1-2 — `reply_count` N+1 on every comment ✅ FIXED

- **Where:** `apps/comments/serializers.py` — `reply_count =
  IntegerField(source="replies.count")`.
- **Why expensive:** one `SELECT COUNT(*) FROM comments WHERE parent_id=…` per
  comment. A 30-comment thread = 30 extra queries.
- **Impact:** measured **23 → 3** queries.
- **Fix:** `CommentViewSet.get_queryset` now `.annotate(reply_count=Count("replies"))`
  (one grouped query); the serializer reads the annotation and falls back to a
  direct count only for un-annotated single instances (e.g. the object returned
  immediately after a create — a rare, single, cheap query).

### P1-3 — full-text search query executed up to 3× per request ✅ FIXED

- **Where:** `apps/search/views.py` `SearchView`.
- **Why expensive:** `get_queryset` called `results.count()` purely to log
  `SearchQueryLog.results_count`, then DRF's paginator independently ran its own
  `COUNT` **and** the page fetch. On PostgreSQL the ranked `SearchVector` /
  `SearchRank` query is the most expensive query in the app, and it ran ~3×.
- **Fix:** logging moved into `list()`, reusing the paginator's already-computed
  `count` from the response. One full FTS execution removed per search; the log
  row is written with the identical value.

### P2-4 — `AggregatedArticle` list N+1 on `imported_article` ✅ FIXED

- **Where:** `apps/aggregation/views.py` — queryset was `.all()`.
- **Why expensive:** `AggregatedArticleSerializer.imported_article_slug` reads
  `imported_article.slug`, lazy-loading the related `Article` **per row**.
- **Fix:** `.select_related("imported_article")`. Admin-only endpoint, but a
  clear one-line win with zero risk.

### P2-5 — no persistent database connections ✅ FIXED

- **Where:** `config/settings.py` DATABASES.
- **Why expensive:** `CONN_MAX_AGE` was unset (Django default `0`), so Django
  **opened and closed a new PostgreSQL connection on every request** — TCP +
  auth handshake on the critical path of each API call, plus connection churn
  CPU on the DB.
- **Fix:** `CONN_MAX_AGE=60` (env-overridable) + `CONN_HEALTH_CHECKS=True` for
  Postgres only (SQLite dev/test untouched). Reused connections are health-checked
  before use so dropped sockets are transparently replaced.

### P2-6 — Notification list missing a supporting index ✅ FIXED

- **Where:** `apps/notifications/models.py`.
- **Why:** the list is always scoped to `recipient` and ordered `-created_at`;
  the only composite index was `(recipient, is_read)`, which doesn't serve the
  sort. Added `Index(fields=["recipient", "-created_at"])` (+ migration
  `0002_...`). See the index report.

---

## Findings left as documented recommendations (not changed)

These are real but were **intentionally not applied** because they would change a
behaviour/contract, add disproportionate complexity, or the simpler status quo is
preferable per the task's "prefer simplicity unless the gain is substantial" rule.

### R1 — Write amplification on counter endpoints (**biggest remaining write cost**)

`articles:register_view`, `ads:impression`, `ads:click`, `comments:report`,
`cms:poll vote` each issue **one `UPDATE` per event** via `F()`. Correct and
race-free, but at scale (every article view = one row write) this is the largest
source of DB write I/O and WAL. **Recommendation:** buffer increments in Redis
(`INCRBY`) and flush aggregated deltas to the DB on a short Celery beat interval
(e.g. every 30–60s) with a single `bulk_update`/`F()` per counter. Deferred:
introduces eventual consistency on counters and a new moving part. See the cost
report.

### R2 — `LiveBlogSerializer.get_latest_updates` per-blog query (kept as-is)

One query per live blog in a list, but each is **bounded to 5 rows** by a DB
`LIMIT`. A blanket `prefetch_related("updates")` would be *worse* — it would load
**all** updates of every (potentially thousands-long) blog into memory. Left
unchanged deliberately; if list sizes grow, use a windowed `Prefetch`.

### R3 — Nested category payload bloat on article cards

`ArticleListSerializer` embeds the **full** `CategorySerializer` (description,
featured_image, SEO fields, parent, order) for every article, though clients only
read `category.name`/`slug`. A `CategoryMiniSerializer` would shrink the busiest
payload. Deferred — it changes the response shape (contract). See the API report.

### R4 — `PhotoGallery` list ships all images per gallery

`PhotoGallerySerializer.images` is nested with no list/detail split, so the
gallery *list* returns every image of every gallery. No N+1 (images are
prefetched) but a large payload. Recommend a light list serializer. Contract
change → deferred.

### R5 — Analytics dashboard & dashboard-stats recomputed live

`analytics/services.dashboard_summary` and `cms.DashboardStatsView` run many
aggregates/counts per call. Staff-only and low-frequency, so acceptable today.
Recommend a short-TTL cache (see caching report) before this is exposed widely.

### R6 — `SiteSetting.load()` per settings request

`get_or_create(pk=1)` on every `/cms/settings/` GET. A single indexed PK lookup —
cheap — but trivially cacheable. See caching report.

---

## What was verified clean (no action needed)

- **`ArticleViewSet`** already uses `select_related("author","category")` +
  `prefetch_related("tags")`, and splits list vs detail serializers. Good.
- **`VideoViewSet`, `PhotoGalleryViewSet`, `LiveBlogUpdateViewSet`** already
  `select_related`/`prefetch_related` their relations.
- **Counter increments** use `F()` (`register_view`, ad/comment/poll) — atomic,
  no read-modify-write race.
- **Bulk paths** use `QuerySet.update()`/`.delete()` correctly
  (`publish_scheduled_articles`, aggregation `hide_source`/`delete_*`/`bulk`,
  newsletter unsubscribe, notification `mark_all_read`).
- **`_top_articles`** already resolves slugs→titles in one `slug__in` query (no
  N+1).
- **Pagination** is global (`DefaultPagination`, `PAGE_SIZE=20`, `max_page_size=100`)
  so no endpoint dumps a whole table.
- **Frontend/mobile** already cache well: Next.js ISR `revalidate` on every server
  fetch; TanStack Query with `refetchOnWindowFocus:false` and `staleTime` 30–60s.

---

## Suggested profiling next steps (production)

- Enable `pg_stat_statements` and review top total-time statements after deploy.
- `EXPLAIN (ANALYZE, BUFFERS)` on the ranked search query and the analytics
  time-series aggregation under real data volume.
- Add a connection pooler (PgBouncer, transaction pooling) once concurrency grows
  beyond what `CONN_MAX_AGE` reuse covers.
