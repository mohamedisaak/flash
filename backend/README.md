# Flash — Backend (Django + DRF)

The API backend for the Flash news publishing platform, built as a **modular
monolith**: one Django app per bounded context under `apps/`.

## Stack

- Python 3.14, Django 6.0, managed with [`uv`](https://docs.astral.sh/uv/)
- PostgreSQL (production/dev) with a SQLite fallback for zero-infra checks
- Redis (cache/broker) with a local-memory fallback

## Apps (bounded contexts)

| App | Responsibility |
|-----|----------------|
| `common` | Shared abstract base models (`TimeStampedModel`, `SEOFields`) |
| `accounts` | Custom `User` model + RBAC roles/status |
| `categories` | `Category` (hierarchical) + `Tag` taxonomy |
| `articles` | `Article`, `ArticleRevision`, `BreakingNewsAlert` + workflow |
| `livecoverage` | `LiveBlog` + `LiveBlogUpdate` real-time posts |
| `videos` | `Video` news items |
| `galleries` | `PhotoGallery` + `GalleryImage` |
| `media` | `ImageRendition` + Pillow image pipeline (responsive WebP/AVIF) |
| `ads` | `Advertisement` with impression/click tracking |
| `newsletters` | `NewsletterSubscriber` |
| `notifications` | `Notification` (push / in-app / email) |
| `comments` | Threaded `Comment` with moderation |
| `analytics` | `PageView`, `SearchQueryLog`, `DailyStat` + staff dashboard summary |
| `seo` | Sitemaps, Google News sitemap, robots.txt, RSS, JSON-LD |
| `search` | Full-text search + autocomplete (pluggable backend) |
| `cms` | `SiteSetting`, `StaticPage`, `SocialLink`, `LiveChannel`, `Poll`, `FAQ` + dashboard stats |
| `aggregation` | Ingest external newsrooms (RSS/API/sitemap) → moderate → promote to `Article` |

## Quick start

```bash
cd backend
uv sync                                   # install deps into .venv

# Option A — zero infrastructure (SQLite fallback):
uv run python manage.py migrate
uv run python manage.py createsuperuser
uv run python manage.py runserver         # http://127.0.0.1:8000/admin/
# API docs:  http://127.0.0.1:8000/api/docs/  (Swagger)
# API base:  http://127.0.0.1:8000/api/v1/

# Option B — Postgres + Redis via Docker (recommended):
docker compose -f ../infrastructure/docker-compose.dev.yml up -d
cp .env.example .env                       # DATABASE_URL/REDIS_URL point at Docker
uv run python manage.py migrate
uv run python manage.py runserver
```

## Background tasks (Celery)

Slow/scheduled work (image renditions, video transcoding, scheduled publishing,
analytics rollups) runs on Celery workers, brokered by Redis.

```bash
# needs Redis (docker compose ... up -d)
uv run celery -A config worker -l info    # runs queued tasks
uv run celery -A config beat -l info      # enqueues periodic tasks on schedule
```

In tests, `CELERY_TASK_ALWAYS_EAGER` runs tasks inline — no worker/Redis needed.

## Code style (Ruff)

[Ruff](https://docs.astral.sh/ruff/) is the single linter **and** formatter
(config in `pyproject.toml`). It replaces flake8 + isort + black.

```bash
uv run ruff check .            # lint
uv run ruff check . --fix      # lint + safe autofixes (unused imports, sorting)
uv run ruff format .           # format
uv run ruff format --check .   # verify formatting (used in CI)
```

Conventions worth knowing: line length 100 (not hard-enforced on long strings);
first-party imports are `apps.*` / `config.*`; migrations are excluded. Ruff
targets Python 3.13 syntax deliberately — the code runs on 3.14 but avoids
3.14-only sugar (e.g. parenthesis-less `except`) so it reads clearly to everyone.

## Tests

```bash
uv run pytest
```

See the repository root [`PLAN.md`](../PLAN.md) for the phase roadmap and
[`teaching/`](../teaching/) for the learning curriculum built from this code.
