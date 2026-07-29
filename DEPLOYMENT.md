# Deployment (Render) — Phase 8

This repo ships a one-file **Render Blueprint** ([render.yaml](render.yaml)) that
stands up the whole production stack. You've already connected GitHub to Render,
so deploying is: push → create Blueprint → set a few URLs → done.

## What gets created

| Service | Type | From | Notes |
|---|---|---|---|
| `flash-db` | PostgreSQL 17 | managed | `basic-256mb` (persistent) |
| `flash-redis` | Key Value (Redis) | managed | Celery broker + Django cache, internal-only |
| `flash-backend` | Web (Docker) | [backend/Dockerfile](backend/Dockerfile) | Django API via gunicorn+uvicorn; WhiteNoise static; media on a persistent disk |
| `flash-worker` | Worker (Docker) | same image | Celery worker **+ embedded beat** (`--beat`) |
| `flash-web` | Web (Docker) | [web/Dockerfile](web/Dockerfile) | Next.js standalone server |

**Only `./backend` and `./web` are ever built.** Repo-root folders —
`teaching/`, `docs/`, `mobile/`, `database-audit/`, `seo-audit/` — are outside
both Docker build contexts, so they are never sent to Render or baked into an
image. `.dockerignore` in each app further strips `.env`, caches, and local data.

## One-time deploy

1. **Push to GitHub** (make sure secrets aren't committed — `.env*` are
   git-ignored; only `*.env.example` are tracked).

2. **Create the Blueprint**: Render Dashboard → **New → Blueprint** → pick this
   repo. Render reads `render.yaml` and provisions everything. First build takes
   a few minutes.

3. **Set the cross-service URLs** (they can't be known until the services exist).
   These are marked `sync: false` in the blueprint, so Render prompts for them —
   fill them in each service's **Environment** tab, then trigger a redeploy.

   On **`flash-web`** (needed at *build* time — set them, then "Clear build cache
   & deploy"):
   | Key | Value |
   |---|---|
   | `NEXT_PUBLIC_API_URL` | `https://flash-backend.onrender.com/api/v1` |
   | `NEXT_PUBLIC_BACKEND_ORIGIN` | `https://flash-backend.onrender.com` |
   | `NEXT_PUBLIC_SITE_URL` | `https://flash-web.onrender.com` (or your domain) |
   | `NEXT_PUBLIC_ADSENSE_CLIENT` | *(optional)* `ca-pub-…` |
   | `NEXT_PUBLIC_ADSENSE_AUTO_ADS` | *(optional)* `true` |

   On **`flash-backend`**:
   | Key | Value |
   |---|---|
   | `SITE_URL` | your web URL, e.g. `https://flash-web.onrender.com` |
   | `CORS_ALLOWED_ORIGINS` | same web origin(s), comma-separated |
   | `CSRF_TRUSTED_ORIGINS` | same web origin(s), comma-separated |

   > Use your **real** URLs. If you attach a custom domain (below), use that.
   > `ALLOWED_HOSTS` is filled automatically from Render's
   > `RENDER_EXTERNAL_HOSTNAME` (see `config/settings.py`), so you don't set it.

4. **Create an admin user** — open a shell on `flash-backend` (Render → the
   service → **Shell**) and run:
   ```bash
   python manage.py createsuperuser
   ```
   Migrations already ran automatically (the backend's `preDeployCommand`).

5. Visit `flash-web`'s URL. Log into the dashboard at `/dashboard/login` and add
   content; the public site renders it.

## Env vars: who sets what

- **Auto (blueprint)**: `SECRET_KEY` (generated), `DATABASE_URL`, `REDIS_URL`,
  `CELERY_*`, `DEBUG=False`, `MEDIA_ROOT`, `SEARCH_BACKEND`, and
  `ALLOWED_HOSTS` (from `RENDER_EXTERNAL_HOSTNAME`).
- **You set once** (`sync: false`): the cross-service URLs in step 3.
- Backend security hardening (HTTPS redirect, HSTS, secure cookies) switches on
  automatically because `DEBUG=False`.

## Media & storage

Uploads are stored on a **1 GB persistent disk** mounted at `/var/media` on the
backend, served by the app at `/media/…`. This is single-instance (a disk can't
be shared), which is fine to start. **To scale the backend horizontally or move
media to a CDN**, switch to S3/Cloudflare R2:

1. Build the backend image with the S3 extra (add `--extra s3` to the
   `uv sync` line in `backend/Dockerfile`).
2. Set `USE_S3=True` and the `S3_*` vars (see `backend/.env.example`).
3. Set `NEXT_PUBLIC_MEDIA_HOST` on `flash-web` to your bucket/CDN host and
   redeploy (so `next/image` may optimize those images).

Also switch to S3 before wiring the image-rendition / video Celery tasks (the
worker would otherwise write media to its own disk, separate from the web's).

## Custom domain

Render → `flash-web` → **Settings → Custom Domains** → add your domain and
follow the DNS instructions. Then update `NEXT_PUBLIC_SITE_URL` (rebuild web),
and the backend's `SITE_URL` / `CORS_ALLOWED_ORIGINS` / `CSRF_TRUSTED_ORIGINS`.
TLS certificates are issued by Render automatically.

## Cost & plans

The blueprint uses paid `starter` compute and a `basic-256mb` database — a real
always-on setup. To trial cheaply you can drop the two web services to `free`
(they cold-start after inactivity); **workers have no free tier**. The **free
Postgres plan is deleted after 30 days**, which is why the blueprint uses a paid
DB — don't put production data on `free`.

## Redeploys & CI

Render auto-deploys on every push to the default branch. `preDeployCommand` runs
migrations before each backend release. There's no GitHub Actions workflow yet;
add one to gate `pytest` / `pnpm build` on PRs if you want (ask and I'll add it).

## Troubleshooting

- **Images 500 / not optimized** → ensure the production media host is in
  `next.config.ts` (it reads `NEXT_PUBLIC_BACKEND_ORIGIN` automatically) and that
  `sharp` is installed (it's a declared dependency).
- **Site points at localhost** → `NEXT_PUBLIC_*` are baked at *build* time. Set
  them, then **Clear build cache & deploy** on `flash-web`.
- **CORS/CSRF errors in the dashboard** → `CORS_ALLOWED_ORIGINS` /
  `CSRF_TRUSTED_ORIGINS` must list the exact web origin (scheme + host).
- **`ImproperlyConfigured: SECRET_KEY …`** → only happens if `DEBUG=False` with
  the insecure default key; the blueprint generates a real one, so this means an
  env var got cleared.
- **Backend won't start / DB errors** → check the `flash-db` is healthy and that
  `preDeployCommand` migrations succeeded (see the deploy logs).

## Deploying the frontend elsewhere

The Dockerfiles are portable. If you'd rather host the Next.js app on Vercel and
only the API on Render, point Vercel's `NEXT_PUBLIC_*` at the Render backend and
skip the `flash-web` service — nothing else changes.
