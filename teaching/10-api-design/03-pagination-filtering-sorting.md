# Pagination, Filtering & Sorting

**Topic:** API Design · **Level:** Intermediate

## 1. Why list endpoints need all three

A news site has millions of articles. `GET /articles/` must never try to return
them all. Three tools tame big collections:

- **Pagination** — return one page at a time.
- **Filtering** — narrow to what you want (`?category=politics`).
- **Sorting** — order the results (`?ordering=-published_at`).

All three are configured globally in
[`config/settings.py`](../../backend/config/settings.py)'s `REST_FRAMEWORK`.

## 2. Pagination

Our [`DefaultPagination`](../../backend/apps/common/pagination.py) returns:

```json
{
  "count": 1043,
  "next": "https://.../articles/?page=3",
  "previous": "https://.../articles/?page=1",
  "results": [ ... 20 items ... ]
}
```

- Default page size: 20. Client override: `?page_size=50`, capped at 100 so no
  one can request the whole table.
- `next`/`previous` are ready-to-use links — the client just follows them.

## 3. Filtering (django-filter)

Simple filters are declared right on the viewset:

```python
filterset_fields = ["placement", "is_active"]   # ads viewset
```

Richer filters get a `FilterSet` class —
[`apps/articles/filters.py`](../../backend/apps/articles/filters.py):

```python
class ArticleFilter(filters.FilterSet):
    category = filters.CharFilter(field_name="category__slug")
    published_after = filters.DateTimeFilter(field_name="published_at", lookup_expr="gte")
```

Now `?category=politics&published_after=2027-01-01` works and is
self-documenting in Swagger.

## 4. Search & ordering

```python
search_fields = ["title", "subtitle", "excerpt", "content"]   # ?search=election
ordering_fields = ["published_at", "views", "created_at"]      # ?ordering=-views
```

`SearchFilter` does a simple case-insensitive contains match — fine for now.
Real ranked full-text search arrives in Phase 4 ([`../23-seo/`](../23-seo/README.md)).

## 5. Common mistakes

- No pagination → one request can exhaust server memory and the client.
- Allowing unbounded `page_size` → same problem, just opt-in.
- Filtering in Python after fetching everything → do it in the database via
  query params, which become SQL `WHERE` clauses.

## 6. Exercises

- **Beginner:** Fetch page 2 of articles at 5 per page. What's the URL?
- **Intermediate:** Find all breaking articles in `technology` ordered by views
  descending, using only query params.
- **Advanced:** Add a `min_reading_time` filter to `ArticleFilter`.

## 7. Interview questions

- **Junior:** Why paginate?
- **Mid:** Offset vs cursor pagination — trade-offs at scale?
- **Senior:** How do filtering and indexing interact for performance?

← [API Design index](README.md)
