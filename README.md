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
web/             Next.js public site + editorial/author dashboards
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
- ✅ **Phase 5** — Web frontend: public site (home/article/category/search,
  SSR/ISR, metadata + JSON-LD) **and** the editorial/author dashboards (Phase 5b:
  JWT login, role-gated shell, article CRUD with Tiptap + React Hook Form + Zod,
  scheduling, overview stats). Builds clean.

Next up: **Phase 6** — Expo / React Native mobile app.

## Quick start

New here? Read the **[Development guide](docs/DEVELOPMENT.md)** — setup, daily
commands, conventions, recipes, and troubleshooting for all three surfaces.

```bash
make install         # backend (uv) + web (pnpm) + mobile (npm)
make dev-backend     # Django API on :8000   (in its own terminal)
make dev-web         # Next.js on :3000      (in another)
make dev-mobile      # Expo dev server       (in another)
make verify          # run every quality gate before you commit
```

Run `make help` for all tasks. Backend-only quick start and the Postgres + Redis
workflow are in [`backend/README.md`](backend/README.md).

## Learn it

Start at the [curriculum index](teaching/README.md), then the
[introduction](teaching/00-introduction/README.md).

## Key documents

- [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md) — **developer onboarding & workflow.**
- [`PLAN.md`](PLAN.md) — full phase roadmap and decisions.
- [`CLAUDE.md`](CLAUDE.md) — engineering + teaching rules for contributors/AI.
- [`docs/architecture.md`](docs/architecture.md) — system architecture.
- [`docs/database-erd.md`](docs/database-erd.md) — database ERD.
