# News Publishing Platform — Roadmap

> This is the canonical, living plan for this repository. It lives in the
> project root (not a user-home scratch folder) so it travels with the code
> and stays in sync as phases complete. See [CLAUDE.md](CLAUDE.md) for the
> operating rules an AI assistant must follow while working in this repo.

## Context

The goal is a production-grade, multi-surface news publishing platform
(public website, mobile app, editorial/admin dashboard, author CMS, REST
API, media pipeline, ads, SEO, notifications, analytics) built on
Django/DRF + Next.js + React Native, optimized for low infra cost (single
VPS to start) and SEO-first performance.

On top of being a production application, this repository is also a
**complete self-study software engineering curriculum**: every feature,
file, table, endpoint, and architectural decision built here must be
accompanied by teaching material in `teaching/` that lets the project owner
learn each underlying technology from the actual source code. See
"AI Teaching Mode" below — this applies to every phase, not just Phase 1.

Current repo state (as of the last plan update): a fresh
`django-admin startproject flash` scaffold at the repo root — `manage.py`,
`flash/{settings,urls,asgi,wsgi}.py`, `db.sqlite3`, `pyproject.toml`
(Django 6.0.7, Python 3.14 via `uv`). No git commits yet. Greenfield build.

## Guiding Decisions

- **Monorepo**, single git repo, top-level dirs: `backend/`, `web/`,
  `mobile/`, `infrastructure/`, `docs/`, `teaching/`.
- **Backend**: Django 6.0.7 / Python 3.14 (already installed via `uv`; both
  exceed the spec's Django 5+/Python 3.13+ floor) + DRF, structured as a
  modular monolith: one Django app per bounded context (`accounts`,
  `articles`, `categories`, `media_library`, `videos`, `galleries`,
  `livecoverage`, `ads`, `newsletters`, `notifications`, `comments`,
  `analytics`, `seo`), each owning its own models/serializers/views/services,
  kept loosely coupled via signals/service functions rather than cross-app
  model imports.
- **Web**: Next.js 16 (App Router) + TS + Tailwind + Shadcn, SSR/SSG/ISR
  per-route based on content volatility.
- **Mobile**: Expo (React Native) + Expo Router, consumes the same DRF API.
- **Infra**: Docker Compose (Postgres, Redis, backend, celery worker+beat,
  web, nginx), GitHub Actions CI, Let's Encrypt via nginx/certbot — no k8s,
  no paid managed services required to run.
- **Incremental delivery**: each phase ends in a runnable, verifiable state
  before moving to the next.
- **Teach-as-you-build**: no feature is "done" until its paired teaching
  material exists (see below). Documentation is not a separate cleanup pass
  — it ships with the code that introduced the concept.

## Root Project Structure

```text
project-root/
├── backend/         Django + DRF modular monolith
├── web/             Next.js public site + admin + author dashboards
├── mobile/          Expo/React Native app
├── infrastructure/  Docker Compose, nginx, CI configs
├── docs/            Architecture, ERD, API spec, deployment guides
└── teaching/        Self-study curriculum built from this project's own code
```

## AI Teaching Mode

This project is simultaneously a production application **and** a complete
software engineering learning platform for the project owner, who starts
at beginner level. Whenever an AI assistant works in this repo it must act
as a Senior Architect / Backend / Frontend / Mobile / DevOps / Database /
QA / SEO Engineer *and* as a technical mentor — building the feature, then
teaching it.

### `teaching/` structure (scaffolded in Phase 0, filled in incrementally)

```text
teaching/
├── 00-introduction/        21-nativewind/
├── 01-software-engineering/22-mobile-architecture/
├── 02-git-github/          23-seo/
├── 03-linux/               24-testing/
├── 04-python/              25-docker/
├── 05-django/               26-nginx/
├── 06-django-rest-framework/27-github-actions/
├── 07-postgresql/           28-deployment/
├── 08-redis/                29-system-design/
├── 09-celery/                30-database-design/
├── 10-api-design/            31-security/
├── 11-authentication/        32-performance/
├── 12-nextjs/                 33-monitoring/
├── 13-react/                  34-production-readiness/
├── 14-typescript/             35-project-walkthrough/
├── 15-tailwind/                36-debugging/
├── 16-shadcn/                  37-faq/
├── 17-react-query/             38-glossary/
├── 18-zustand/                 39-roadmaps/
├── 19-react-native/
└── 20-expo/
```

### Rules the AI must follow going forward

1. **Markdown-first**: every topic is taught via numbered markdown lessons
   inside the matching `teaching/NN-topic/` folder (e.g.
   `teaching/05-django/05-models.md`).
2. **File-paired docs**: creating a non-trivial file requires a matching
   explainer under `teaching/<topic>/project-files/<name>-explained.md`
   covering why it exists, the problem it solves, how it works, how it
   interacts with other files, common mistakes, and best practices.
3. **Code-paired lessons**: introducing a meaningfully new concept (a model,
   an endpoint, a component, a screen, a test pattern) requires a matching
   lesson covering the concept generally, not just the one instance.
4. **Teach-as-you-build loop**, per feature: build it → explain it → diagram
   it (Mermaid) → add exercises (beginner/intermediate/advanced + solutions)
   → add quiz questions → add debugging examples → add interview questions
   (junior/mid/senior).
5. **Depth scales with teaching value.** A brand-new concept (e.g. "what is
   a Django migration") gets a full lesson with analogies and exercises. A
   repetitive instance of an already-taught pattern (e.g. the 6th
   near-identical DRF serializer) gets a short note or an addition to the
   existing lesson's examples, not a duplicate lesson — this keeps the
   curriculum a coherent reference instead of noise. When in doubt, prefer
   updating an existing lesson over spawning a near-duplicate file.
6. **Dedicated tracks** get maintained as their own directories per the spec:
   `29-system-design/` (client-server, REST, auth flow, request lifecycle,
   caching, CDN, reverse proxy, scaling, load balancing, background jobs),
   `30-database-design/` (every table: purpose, columns, relationships,
   constraints, indexes, query examples, normalization), `10-api-design/`
   (every endpoint: URL, method, request/response bodies, errors, security),
   `35-project-walkthrough/` (folder structure, request flow, auth flow,
   article publishing workflow, SEO workflow, deployment workflow — written
   once the pieces they describe actually exist).
7. **A phase is not complete** until its code changes AND its teaching
   material are both committed.
8. Full requirement text (exercises, quizzes, interview prep formats, etc.)
   lives in `teaching/00-introduction/` as the curriculum's own style guide,
   so it's discoverable from inside the curriculum itself rather than only
   in this plan.

## Phase Roadmap

**Phase 0 — Repo restructuring (mechanical, do first)**
Move `manage.py`, `flash/` → `backend/manage.py`, `backend/config/` (rename
the Django project package from `flash` to `config`); move
`pyproject.toml`/`uv.lock` into `backend/`; drop `db.sqlite3` (Postgres via
Docker from here on); scaffold `web/`, `mobile/`, `infrastructure/`, `docs/`
placeholders; scaffold the full `teaching/00-…39-…` directory skeleton with
an index README per folder; write root `README.md`, `PLAN.md` (this file),
`CLAUDE.md`. First commit.

**Phase 1 — Architecture & Database Design**
Postgres + Redis via `infrastructure/docker-compose.dev.yml`; Django apps
with full model layer (custom `User` + RBAC, `Category`, `Tag`, `Article` +
revisions/statuses, `BreakingNewsAlert`, `LiveBlog`/`LiveBlogUpdate`,
`Video`, `PhotoGallery`+`GalleryImage`, `Advertisement` + tracking,
`NewsletterSubscriber`, `Notification`, `Comment` (nested), SEO metadata
mixin); environment-based settings, Postgres, Redis cache, full-text search
fields. Deliverable: ERD in `docs/`, migrations applied, admin registered
for every model, **plus** `teaching/05-django/` model lessons and
`teaching/30-database-design/` per-table docs for everything created.

**Phase 2 — Backend core (DRF API)**
JWT auth, RBAC permission classes, serializers/viewsets/routers per app,
filtering/search/ordering, pagination, `/api/v1/` namespace, OpenAPI +
Swagger via drf-spectacular, rate limiting, audit logging — paired with
`teaching/06-django-rest-framework/`, `teaching/10-api-design/`,
`teaching/11-authentication/` lessons and per-endpoint docs.

**Phase 3 — Media & background processing**
Storage abstraction (local → MinIO/S3), Pillow image pipeline, FFmpeg video
pipeline, Celery + Redis broker + beat schedule — paired with
`teaching/08-redis/`, `teaching/09-celery/` lessons.

**Phase 4 — SEO & search**
Sitemaps (incl. Google News), robots.txt, RSS, JSON-LD structured data,
Postgres full-text search, OpenSearch interface for later swap-in — paired
with `teaching/23-seo/`.

**Phase 5 — Web frontend (Next.js)**
Public site + Editorial/Admin dashboard + Author dashboard — paired with
`teaching/12-nextjs/`, `13-react/`, `14-typescript/`, `15-tailwind/`,
`16-shadcn/`, `17-react-query/`.

**Phase 6 — Mobile app (Expo)**
Feature-based Expo Router app, offline cache, push notifications — paired
with `teaching/19-react-native/`, `20-expo/`, `21-nativewind/`,
`22-mobile-architecture/`.

**Phase 7 — Notifications & analytics**
FCM push, in-app/email delivery, internal analytics dashboard, GA/Search
Console — paired with relevant lessons under `29-system-design/` and a new
analytics note set.

**Phase 8 — DevOps, CI/CD, security hardening, testing**
Production Docker Compose + nginx + certbot, GitHub Actions, pytest/
Vitest/Jest test suites targeting 80% coverage, security pass, backup/
restore runbook, production checklist — paired with `teaching/24-testing/`,
`25-docker/`, `26-nginx/`, `27-github-actions/`, `28-deployment/`,
`31-security/`, `32-performance/`, `33-monitoring/`,
`34-production-readiness/`.

`teaching/35-project-walkthrough/` and `teaching/39-roadmaps/` get written
last, once there's a real system to walk through and a real history to
summarize.

Each phase after 0/1 is large enough to warrant its own detailed sub-plan
when it starts — this document sequences and scopes them; file-level detail
is added phase by phase.

## Verification

- Phase 0: `cd backend && uv run manage.py check` passes; repo boots from
  new paths; `teaching/` skeleton exists with an index file per folder.
- Phase 1: `uv run manage.py makemigrations --check`, `migrate`, and
  `runserver` + `/admin/` shows all registered models; ERD doc committed;
  matching teaching lessons committed alongside.
- Later phases: each has its own test suite run (pytest / vitest / jest)
  plus a manual smoke pass before being called done, plus a teaching-docs
  completeness check (every new file/concept has its paired lesson).

## Status

- [x] Phase 0 — Repo restructuring (backend/ + teaching/ scaffold, 40 topics)
- [x] Phase 1 — Architecture & Database Design (12 apps, models, migrations,
      admin, ERD, paired teaching lessons)
- [x] Phase 2 — Backend core (DRF API: JWT auth, RBAC, 37 endpoints, OpenAPI
      docs, throttling, audit log, 16 passing tests, paired teaching lessons)
- [x] Phase 3 — Media & background processing (Celery + Redis, Pillow image
      pipeline, FFmpeg video pipeline, scheduled publish + analytics rollup,
      storage abstraction, 26 passing tests, paired teaching lessons)
- [x] Phase 4 — SEO & search (sitemaps + Google News + robots.txt + RSS,
      JSON-LD structured data, Postgres full-text search w/ pluggable backend,
      42 endpoints total, 37 passing tests, paired teaching lessons)
- [x] Phase 5 — Web frontend — public site (home/article/category/search,
      SSR/ISR, metadata + JSON-LD) **and** dashboards (Phase 5b: JWT login,
      role-gated shell, article CRUD with Tiptap + RHF + Zod, scheduling,
      overview stats). Builds clean (typecheck + next build).
- [ ] Phase 6 — Mobile app  ← next
- [ ] Phase 7 — Notifications & analytics
- [ ] Phase 8 — DevOps, CI/CD, security, testing

This plan supersedes the earlier draft that was stored outside the repo at
`~/.claude/plans/keen-mixing-spark.md`.

### Phase 1 — what shipped

- `backend/` modular monolith: 12 apps under `backend/apps/` (common, accounts,
  categories, articles, livecoverage, videos, galleries, ads, newsletters,
  notifications, comments, analytics).
- Custom `User` + RBAC roles; `Article` workflow + revisions + breaking news;
  live blogs; videos; galleries; ads with CTR; newsletters; notifications;
  threaded comments; analytics events. Env-based settings (SQLite fallback so
  `manage.py check`/`migrate` run with zero infra; Postgres via Docker for real
  work).
- All models migrate cleanly (`makemigrations --check` passes) and every model
  is inspectable in the Django admin.
- `infrastructure/docker-compose.dev.yml` (Postgres + Redis), `backend/.env.example`.
- Docs: `docs/architecture.md`, `docs/database-erd.md`.
- Teaching: curriculum scaffold (40 topics) + real lessons for Django (models,
  migrations, admin, settings & Article deep-dives), Database Design (per-table
  docs for every table), Authentication (users/RBAC), Docker (dev compose),
  System Design (architecture overview), and a Glossary.

### Phase 2 — what shipped

- DRF wired in `config/settings.py`: JWT auth (simplejwt), authenticated-by-
  default permissions, pagination, django-filter search/ordering, anon/user
  throttling, drf-spectacular schema.
- Common API layer: `apps/common/permissions.py` (RBAC permission classes),
  `pagination.py`, and `middleware.py` (audit logging of write requests).
- Auth endpoints (`/api/v1/auth/`): register, JWT login + refresh, `me`.
- Serializers + viewsets + routers for every content app; **37 endpoints**
  under `/api/v1/`, assembled by `config/api_v1.py` (versioning composition
  root).
- OpenAPI docs at `/api/schema/`, `/api/docs/` (Swagger), `/api/redoc/` —
  generated warning-free.
- 16 pytest tests (auth, articles RBAC/visibility, comment moderation) — a
  failing test caught and fixed a real authorization gap (subscribers could
  create articles).
- Docs: `docs/api.md`. Teaching: `06-django-rest-framework/` (5 lessons),
  `10-api-design/` (4 lessons), `11-authentication/` (JWT + permissions).

### Phase 3 — what shipped

- Celery app (`config/celery.py`, loaded via `config/__init__.py`) + `CELERY_*`
  settings and a `CELERY_BEAT_SCHEDULE`; Redis broker/result backend.
- `apps/media`: `ImageRendition` model + Pillow service generating responsive
  renditions (thumbnail/small/medium/large × WebP/AVIF, never upscaling,
  EXIF-aware) + a thin `@shared_task` wrapper + admin.
- `apps/videos`: FFmpeg service (probe duration, thumbnail, HLS transcode) +
  `process_video` task that degrades gracefully when ffmpeg is absent.
- Periodic tasks: `articles.publish_scheduled_articles` (every minute) and
  `analytics.aggregate_daily_analytics` → new `DailyStat` summary model (raw
  events → summary tables, idempotent).
- Storage abstraction via Django `STORAGES`: local disk by default, S3/MinIO
  when `USE_S3=True` (optional `s3` dependency extra).
- 26 pytest tests (10 new: image pipeline, video guard, scheduled publish,
  analytics rollup), all with Celery eager — no worker/broker needed in CI.
- Teaching: `08-redis/` (1 lesson) and `09-celery/` (5 lessons: intro, setup,
  image pipeline, video pipeline, periodic tasks).

### Phase 4 — what shipped

- `apps/seo`: standard `sitemap.xml` (articles/categories/videos/galleries,
  SITE_URL-based absolute URLs), Google News sitemap (`/news-sitemap.xml`, 48h
  window, templated), `robots.txt`, RSS feeds (`/rss/`, `/rss/<category>/`).
- JSON-LD structured data builders (NewsArticle, Organization, BreadcrumbList,
  VideoObject) exposed via `/api/v1/seo/...` — `seo` depends on the content apps,
  never the reverse (one-way dependency).
- `apps/search`: pluggable `SearchBackend` interface; `PostgresSearchBackend`
  (weighted full-text + `SearchRank`, `websearch` query type) with an
  `icontains` fallback on SQLite; `OpenSearchBackend` stub behind
  `SEARCH_BACKEND`. Endpoints `/api/v1/search/` (ranked, paginated, logs to
  `SearchQueryLog`) and `/api/v1/search/autocomplete/`.
- 42 API paths total; 37 tests (11 new: search visibility/logging/autocomplete/
  backend-selection, sitemap host, news sitemap, robots, RSS, article + org
  JSON-LD). Schema generates clean.
- Teaching: `23-seo/` (5 lessons: foundations, structured data, sitemaps/robots,
  RSS, search). Docs: `docs/api.md` updated.

### Phase 5 — what shipped (public site)

- `web/` Next.js 16 App Router app (React 19, TS, Tailwind v4, TanStack Query).
- Build-safe typed API client (`src/lib/api.ts`) + types mirroring the DRF
  serializers; centralized env config.
- Pages: home (ISR 60s), `articles/[slug]` (ISR 300s + `generateMetadata` +
  embedded NewsArticle/Breadcrumb JSON-LD from the backend SEO endpoints),
  `[category]` (ISR 120s, matches the sitemap's `/{slug}`), `search`
  (client-side TanStack Query, `noindex`).
- shadcn-style owned UI primitives (Button/Card/Badge), server-rendered header
  with category nav, article cards using `next/image`.
- Verified: `pnpm typecheck` and `pnpm build` both pass; route table shows
  home/404 static (ISR) and article/category/search dynamic.
- Teaching: `12-nextjs/` (6 lessons), `13-react/` (3), `14-typescript/` (2),
  `15-tailwind/` (1), `16-shadcn/` (1), `17-react-query/` (2).

### Phase 5c — full CMS admin (added on request)

Backend `apps/cms` (SiteSetting singleton, SocialItem, LiveChannel, FAQ,
StaticPage, Poll, Language) + staff APIs for author management
(`/users/`), subscribers (`/newsletter/subscribers/` + send-email), and a
dashboard `/stats/` endpoint. Frontend: a full grouped admin sidebar
(Dashboard, Setting, Author List, Advertisements, News▸Categories/
SubCategories/Posts, Photo/Video Gallery, Pages, FAQ, Languages, Subscribers,
Live Channel, Online Poll, Social Items, Edit Profile), driven by a
config-driven `CrudSection` (list + add/edit modal + delete, JSON or multipart
upload) so each section is a few lines. Dashboard shows platform-wide stat
tiles. 61 API paths; 37 backend tests pass; web build clean (26 routes).

### Phase 5b — what shipped (dashboards)

- Auth: Zustand session store + token helpers (`auth-store.ts`); authenticated
  fetch client with transparent 401→refresh→retry (`auth-api.ts`).
- Route structure: `app/dashboard/` with a `noindex` layout; a `(app)` route
  group gated by `DashboardShell` (loads `/auth/me`, redirects anonymous users);
  `login/` outside the group.
- Article management: role-scoped list (authors see own via `?author=`, editors
  see all), overview with stat tiles (counts by status) + recents, create/edit
  form with **React Hook Form + Zod** validation and a **Tiptap** rich-text
  editor; status + scheduled-publish datetime mapped to the API payload.
- Verified: `pnpm typecheck` + `pnpm build` pass (8 routes incl. the dashboard).
- Teaching: `18-zustand/` (1 lesson) + `12-nextjs/07-dashboard-and-forms.md`.

### Phase 6 — next up

Mobile app (Expo / React Native + Expo Router): home, categories, search,
bookmarks, notifications, breaking/live/video, offline reading — reusing the DRF
API — with paired lessons in `teaching/19-react-native/`, `20-expo/`,
`21-nativewind/`, `22-mobile-architecture/`.
