# REST API — Flash News Platform

The backend exposes a versioned JSON REST API built with Django REST Framework.
Teaching-level explanations live in
[`teaching/06-django-rest-framework/`](../teaching/06-django-rest-framework/README.md)
and [`teaching/10-api-design/`](../teaching/10-api-design/README.md).

## Interactive & machine-readable docs

With the server running (`uv run python manage.py runserver`):

| URL | What |
|-----|------|
| `/api/docs/` | **Swagger UI** — interactive explorer ("try it out") |
| `/api/redoc/` | ReDoc — clean reference docs |
| `/api/schema/` | raw OpenAPI 3 schema (YAML) |

Generate the schema to a file: `uv run python manage.py spectacular --file schema.yml`.

These are generated from the code, so they are always in sync with the actual
endpoints — treat them as the authoritative reference.

## Base URL & versioning

All endpoints are under **`/api/v1/`**. Breaking changes will ship under a future
`/api/v2/` while v1 keeps serving existing clients.

## Authentication

JWT (Bearer tokens). Obtain a pair, then send the access token on each request:

```
POST /api/v1/auth/login/          {username, password}  → {access, refresh}
POST /api/v1/auth/login/refresh/  {refresh}             → {access}
Authorization: Bearer <access token>
```

## Endpoint groups (37 paths)

| Group | Prefix | Notes |
|-------|--------|-------|
| Auth & profile | `/auth/` | register, login, refresh, me |
| Articles | `/articles/`, `/breaking-news/` | published-only for the public; `+/view/` action |
| Taxonomy | `/categories/`, `/tags/` | slug-addressed |
| Video | `/videos/` | |
| Galleries | `/galleries/`, `/gallery-images/` | |
| Live coverage | `/live-blogs/`, `/live-updates/` | poll `/live-updates/?live_blog=<id>` |
| Ads | `/ads/` | `+/impression/`, `+/click/` tracking actions |
| Comments | `/comments/` | moderation-aware; `+/report/` action |
| Notifications | `/notifications/` | owner-scoped; mark-read actions |
| Newsletter | `/newsletter/subscribe/`, `/newsletter/unsubscribe/<token>/` | |
| Analytics | `/analytics/pageview/` | public ingest beacon |
| Search | `/search/?q=`, `/search/autocomplete/?q=` | ranked results + suggestions |
| SEO / JSON-LD | `/seo/organization/`, `/seo/articles/<slug>/`, `/seo/videos/<slug>/` | schema.org structured data |

## SEO endpoints outside the API

Served at the site root (not under `/api/`), for search-engine crawlers:

| URL | What |
|-----|------|
| `/sitemap.xml` | standard sitemap (articles, categories, videos, galleries) |
| `/news-sitemap.xml` | Google News sitemap (last 48h) |
| `/robots.txt` | crawler rules + sitemap pointers |
| `/rss/`, `/rss/<category-slug>/` | RSS feeds |

## Conventions

- **Pagination**: list responses are `{count, next, previous, results}`; default
  page size 20, `?page_size=` up to 100.
- **Filtering / search / ordering**: e.g.
  `/articles/?category=politics&search=election&ordering=-published_at`.
- **Permissions**: reads are mostly public; writes require the appropriate role
  (see the auth teaching track). Ordinary subscribers can comment but not
  publish.
- **Rate limiting**: 60/min anonymous, 1000/min authenticated (configurable via
  env).
- **Status codes**: `200/201` success, `400` invalid input, `401` not logged in,
  `403` not allowed, `404` not found, `429` throttled.
