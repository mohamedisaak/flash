# Development guide

The one page a new developer reads first. It covers setup, day-to-day commands,
where things live, the conventions that keep the codebase consistent, recipes for
common changes, and the gotchas that trip people up.

- **Concepts & deep dives:** [`teaching/`](../teaching/) (a full curriculum built
  from this code) and [`docs/architecture.md`](architecture.md).
- **Roadmap & decisions:** [`PLAN.md`](../PLAN.md).
- **AI-assistant rules:** [`CLAUDE.md`](../CLAUDE.md).

---

## 1. Prerequisites

| Tool | Used by | Notes |
|------|---------|-------|
| [`uv`](https://docs.astral.sh/uv/) | backend | Python 3.14 toolchain + venv |
| [`pnpm`](https://pnpm.io/) | web | Next.js 16 |
| `npm` | mobile | Expo SDK 54 |
| Docker (optional) | Postgres + Redis | SQLite/local-memory fallbacks work without it |
| `make` | all | task runner (see `make help`) |

## 2. First-time setup

```bash
make install                 # backend (uv sync) + web (pnpm) + mobile (npm)

# backend env + database (SQLite fallback — no Docker needed)
cd backend && cp .env.example .env
cd .. && make migrate
cd backend && DJANGO_SETTINGS_MODULE=config.settings uv run python manage.py createsuperuser

# web env
cd web && cp .env.example .env.local     # NEXT_PUBLIC_API_URL -> http://localhost:8000/api/v1
```

Demo logins (if you loaded seed data): `admin` / `admin12345` (admin panel),
`author` / `author12345` (author panel).

## 3. Running the stack

Three terminals (backend first — both frontends read from it):

```bash
make dev-backend     # Django API on 0.0.0.0:8000
make dev-web         # Next.js on :3000
make dev-mobile      # Expo (scan QR in Expo Go, or press i / a)
```

`make services` starts Postgres + Redis in Docker if you want them instead of the
SQLite fallback (needed only for Celery background tasks / Postgres-specific work).

## 4. Quality gates

```bash
make verify          # everything: backend check+migrations+lint+tests, web typecheck+lint+build, mobile typecheck
make test            # backend pytest
make lint            # ruff + eslint + expo lint
make format          # ruff format + prettier (web & mobile)
```

Run `make verify` before every commit. Per-surface equivalents live in each
surface's README (`backend/`, `web/`, `mobile/`).

## 5. Repo map

```text
backend/   Django + DRF modular monolith. One app per bounded context under apps/.
           A phase isn't "done" until migrations apply, `manage.py check` passes,
           and its tests run. See backend/README.md.
web/       Next.js App Router. (site) = public, dashboard/(app) = admin. Two API
           layers: lib/api.ts (public, build-safe) and lib/auth-api.ts (JWT).
           See web/README.md.
mobile/    Expo / React Native. A second frontend over the SAME API. src/lib/
           mirrors web/src/lib. See mobile/README.md.
docs/      Architecture, API, ERD, and this guide.
teaching/  Numbered curriculum (00–41) explaining every concept from the code.
```

## 6. Conventions

**Backend**
- **Modular monolith:** each app owns its models/serializers/views/services. No
  cross-app *model imports* — communicate via service functions or signals.
  (Read-only cross-app queries for a dashboard count are fine.)
- **Business logic in `services.py`,** not views, so it's unit-testable.
- **Derive, don't store** computed values (CTR, reading time) so they can't drift.
- Ruff is linter + formatter; it targets py3.13 syntax on purpose (see backend/README).

**Web**
- **Config-driven CRUD:** most dashboard sections are field/column config on
  `components/dashboard/crud/CrudSection`. Extend it before hand-rolling.
- **Explicit caching:** every `lib/api.ts` call sets its own ISR `revalidate`.
- **Theme via CSS vars:** `--color-brand` / `--color-accent` from `SiteSettings`.

**Mobile**
- `src/lib/` mirrors web; keep type shapes in sync with the backend serializers.

**All surfaces:** a feature isn't complete until its **teaching material** is
written too (see CLAUDE.md, "AI Teaching Mode").

## 7. Recipes — how to add…

**A backend API endpoint**
1. Model in `apps/<app>/models.py` → `makemigrations` → `migrate`.
2. Serializer in `serializers.py`; viewset/view in `views.py`; route in `urls.py`.
3. Mount the app's `urls` in `config/api_v1.py` if new.
4. Test in `apps/<app>/tests/`; run `uv run pytest` + `uv run manage.py spectacular`
   (keep the OpenAPI schema warning-free — document custom views with
   `@extend_schema`).
5. Pair a lesson under `teaching/`.

**A dashboard CRUD section (web)**
1. Add a page under `web/src/app/dashboard/(app)/<name>/page.tsx` that renders
   `<CrudSection>` with `fields` + `columns` config (copy `ads/page.tsx`).
2. Add the nav link in `components/dashboard/dashboard-shell.tsx`.
3. If it uploads files, set `hasFiles` and use `resource()`'s upload methods.

**A public page (web)**
1. Route under `web/src/app/(site)/…`.
2. Fetch via a `lib/api.ts` method with a sensible `revalidate` (short for
   admin-editable content).

**A mobile screen**
1. File under `mobile/src/app/…` (Expo Router = file-based).
2. Fetch via `src/lib/api.ts` + TanStack Query.

## 8. Troubleshooting

- **"I edited content/categories/ads but the site still shows the old value."**
  Almost always the ISR cache in `lib/api.ts` (short per-call windows) *plus* the
  dev server holding fetches in memory. Restart `pnpm dev` (or `rm -rf web/.next`
  then restart) to force a refresh. Admin-editable content uses short caches
  (15–120s) so edits normally appear within a minute or two.
- **Mobile "Couldn't load content" on a physical phone.** Wrong LAN IP or the
  server bound to `127.0.0.1`. Set `mobile/.env` + backend `ALLOWED_HOSTS` to your
  IP (`ipconfig getifaddr en0`), run the API with `make dev-backend` (binds
  `0.0.0.0`), and restart Expo with `npx expo start -c`. Phone must be on the same
  Wi-Fi.
- **Analytics visitor count looks low.** Logged-in newsroom staff are excluded by
  design; browse in a logged-out/private window to generate visitor events.
- **`pnpm <script>` fails with `ERR_PNPM_IGNORED_BUILDS`.** Approve or decline the
  native build in `web/pnpm-workspace.yaml` (`allowBuilds`).
