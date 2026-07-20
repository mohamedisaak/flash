# Flash — News Publishing Platform

A production-grade, multi-surface news publishing platform (public website,
mobile app, editorial/admin dashboard, author CMS, REST API, media pipeline,
ads, SEO, notifications, analytics) — built to run affordably on a single VPS
and scale from there.

Flash is **also a complete self-study software engineering curriculum**: every
part of the codebase is explained, from beginner level up, in
[`teaching/`](teaching/README.md). Read the repo, learn the stack.

## Monorepo layout

```text
backend/         Django + DRF modular monolith (the API & data layer)
web/             Next.js public site (done) + dashboards (Phase 5b)
mobile/          Expo / React Native app                        (Phase 6)
infrastructure/  Docker Compose, Nginx, CI configs
docs/            Architecture, ERD, and reference documentation
teaching/        Self-study curriculum built from this project's own code
```

## Status

The build proceeds in phases (see [`PLAN.md`](PLAN.md)). **Done so far:**

- ✅ **Phase 0** — Monorepo restructuring + teaching curriculum scaffold.
- ✅ **Phase 1** — Architecture & database design: 12 Django apps, full model
  layer, migrations, admin, ERD, and paired teaching lessons.
- ✅ **Phase 2** — DRF REST API: JWT auth, RBAC permissions, 37 endpoints under
  `/api/v1/`, OpenAPI/Swagger docs, throttling, audit logging, and 16 tests.
- ✅ **Phase 3** — Media & background processing: Celery + Redis, Pillow image
  renditions (WebP/AVIF), FFmpeg video pipeline, scheduled publishing +
  analytics rollups, pluggable storage (local → S3/MinIO), 26 tests.
- ✅ **Phase 4** — SEO & search: sitemaps + Google News sitemap + robots.txt +
  RSS, JSON-LD structured data, PostgreSQL full-text search with a pluggable
  backend, 37 tests.
- 🟡 **Phase 5** — Web frontend (public site): Next.js 16 App Router with
  home/article/category/search, SSR/ISR, dynamic metadata + embedded JSON-LD,
  typed API client, Tailwind v4, TanStack Query. Builds clean. *(Admin + author
  dashboards remain — Phase 5b.)*

Next up: **Phase 5b** — editorial/admin & author dashboards.

## Quick start (backend)

```bash
cd backend
uv sync
uv run python manage.py migrate        # SQLite fallback — zero infra needed
uv run python manage.py createsuperuser
uv run python manage.py runserver      # http://127.0.0.1:8000/admin/
```

For the Postgres + Redis workflow, see [`backend/README.md`](backend/README.md).

## Learn it

Start at the [curriculum index](teaching/README.md), then the
[introduction](teaching/00-introduction/README.md).

## Key documents

- [`PLAN.md`](PLAN.md) — full phase roadmap and decisions.
- [`CLAUDE.md`](CLAUDE.md) — engineering + teaching rules for contributors/AI.
- [`docs/architecture.md`](docs/architecture.md) — system architecture.
- [`docs/database-erd.md`](docs/database-erd.md) — database ERD.
