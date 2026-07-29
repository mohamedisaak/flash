# Query Optimization Report

Before/after SQL query counts for the endpoints touched by this audit. Counts
captured with Django's `CaptureQueriesContext` against the live DRF stack, seeded
with representative data. "Warm" = the category-count cache is populated (steady
state in production); "cold" = first request after a write invalidated the cache.

---

## Before → after

| Endpoint | Rows | Before | After (warm) | After (cold) | Δ |
|---|---:|---:|---:|---:|---:|
| `GET /articles/` | 20 | 23 | **3** | 8 | −87% / −65% |
| `GET /comments/?article=` | 30 | 23 | **3** | 3 | −87% |
| `GET /categories/` | 5 | 7 | **2** | 2 | −71% |
| `GET /aggregation/items/` | N | 1 + N | **1** (+page/count) | — | −N |
| `GET /search/?q=` | — | FTS × 3 | FTS × 2 | — | −1 FTS exec |

### Where the "after" queries come from (article list, warm)
1. `SELECT COUNT(*)` for pagination.
2. `SELECT … FROM articles JOIN author JOIN category` (the page, with
   `select_related`).
3. `SELECT … FROM tags` (single `prefetch_related` for all rows' tags).

That's the irreducible minimum for a paginated, related-object list. Category
counts are served from cache (0 queries) once warm; on a cold cache they add one
grouped miss per distinct category (the 8-query cold case = 3 + 5 distinct
categories).

### Where the "before" queries came from (article list)
Same 3 as above **+ 20** `SELECT COUNT(*) FROM articles WHERE category_id=…`, one
per serialized row (`CategorySerializer.article_count = source="articles.count"`).

---

## Techniques applied

| Technique | Applied at |
|---|---|
| `annotate(Count(...))` to fold N counts into 1 grouped query | `CategoryViewSet`, `CommentViewSet` |
| Cache + signal invalidation for a derived count in nested/`select_related` contexts | `categories.services` + `categories.signals` |
| `select_related(FK)` to kill lazy-load N+1 | `AggregatedArticleViewSet.imported_article` |
| Reuse paginator's `count` instead of a second aggregate | `SearchView.list` |
| Persistent connections (`CONN_MAX_AGE`) | `settings.DATABASES` |
| Supporting composite index for scan+sort | `Notification (recipient, -created_at)` |

Already-optimal patterns left untouched: `ArticleViewSet`
(`select_related`+`prefetch_related`+list/detail split), `VideoViewSet`,
`PhotoGalleryViewSet`, `LiveBlogUpdateViewSet`, `F()` counter updates, bulk
`update()`/`delete()` paths, and the `_top_articles` `slug__in` batch resolve.

---

## Execution-time notes

Query *count* is the measurable, deterministic proxy used here (wall-clock time
on SQLite dev data is dominated by fixed overhead and isn't representative of
production Postgres). The count reductions translate to execution-time savings
because each eliminated query was a **separate round trip + index scan**:

- The 20 eliminated per-request `COUNT(*)` scans on the article list were each an
  index scan over `articles(category_id)` — on a large table these are the
  expensive part, not the base list query.
- Removing one full-text-search execution per search removes the single most
  CPU-intensive query in the app from the critical path of every search.

Recommend confirming with `EXPLAIN (ANALYZE, BUFFERS)` and `pg_stat_statements`
against production data volume after deploy (see performance report).

---

## Validation

- Full suite: **72 passed** before and after.
- No test asserts on query counts, so no test was coupled to the old behaviour.
- `article_count` and `reply_count` values are byte-identical to before (verified
  by the passing serializer tests and manual query-count harness).
