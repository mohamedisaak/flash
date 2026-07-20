# Search (PostgreSQL Full-Text + a Pluggable Backend)

**Topic:** SEO / Search · **Level:** Intermediate

## 1. The idea in one sentence

> Full-text search ranks documents by how well they match a query — far better
> than a plain "does this text contain that word" filter.

## 2. Naive matching vs full-text search

`title__icontains="election"` finds the substring but can't rank results, handle
word stems ("run" vs "running"), or weight the title above the body. PostgreSQL's
full-text search does all three by turning text into searchable **tsvectors** and
scoring matches.

## 3. A pluggable backend (the key design idea)

We hide the *how* behind an interface so callers never change when the engine
does. [`apps/search/backends.py`](../../backend/apps/search/backends.py):

```python
def get_search_backend() -> BaseSearchBackend:
    if settings.SEARCH_BACKEND == "opensearch":
        return OpenSearchBackend()      # deferred, but the seam is ready
    return PostgresSearchBackend()
```

Views call `get_search_backend().search_articles(q)` — swapping to OpenSearch
later touches only this file.

## 4. Postgres FTS, with a portable fallback

```python
if connection.vendor == "postgresql":
    vector = (SearchVector("title", weight="A")
              + SearchVector("excerpt", weight="B")
              + SearchVector("content", weight="C"))
    query = SearchQuery(q, search_type="websearch")
    return qs.annotate(rank=SearchRank(vector, query)).filter(rank__gt=0).order_by("-rank")
# SQLite / dev fallback: unranked substring match
return qs.filter(Q(title__icontains=q) | Q(excerpt__icontains=q) | Q(content__icontains=q))
```

- **Weights A/B/C** make a title hit outrank a body hit.
- **`search_type="websearch"`** lets users type Google-style queries
  (`"exact phrase" -exclude`).
- The **fallback** means local dev and tests (on SQLite) still work — just
  without ranking. That's why our tests run with zero Postgres setup.

## 5. The endpoints

[`apps/search/views.py`](../../backend/apps/search/views.py):

- `GET /api/v1/search/?q=...` — ranked, paginated article results. Every query is
  logged to `analytics.SearchQueryLog` (with its hit count) to power "top
  searches" and to spot zero-result queries.
- `GET /api/v1/search/autocomplete/?q=...` — quick title suggestions as you type.

Results always come from `Article.published`, so drafts never appear — a test
asserts a matching draft is excluded.

## 6. Production notes (teaching, not yet wired)

- For speed at scale, store a `SearchVectorField` on the row and index it with a
  **GIN** index, updated by a trigger or on save (Postgres-only, so it's kept out
  of the portable model here).
- Typo tolerance / "did you mean" uses the `pg_trgm` extension
  (`TrigramSimilarity`).
- When the corpus or query volume outgrows Postgres, flip `SEARCH_BACKEND` to
  OpenSearch — the interface is already in place.

## 7. Exercises

- **Beginner:** Search `election` and read the logged `SearchQueryLog` row.
- **Intermediate:** Add `category` as a fourth weighted vector field.
- **Advanced:** Implement the `SearchVectorField` + `GinIndex` optimization
  behind a Postgres-only migration and benchmark it.

## 8. Interview questions

- **Junior:** Why is full-text search better than `LIKE '%word%'`?
- **Mid:** What do the A/B/C weights and `SearchRank` do?
- **Senior:** When do you outgrow Postgres FTS, and how does the backend
  interface make the migration safe?

← [SEO topic index](README.md)
