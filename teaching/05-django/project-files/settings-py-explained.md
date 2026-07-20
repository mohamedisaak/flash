# `config/settings.py` — Explained

The single source of truth for how the backend is configured. This deep-dive
walks the real file: [`backend/config/settings.py`](../../../backend/config/settings.py).

## 1. Why this file exists

Django needs to know: which database to use, which apps are installed, where
files live, security keys, timezone, and more. All of that lives in `settings.py`.
Django finds it via the `DJANGO_SETTINGS_MODULE=config.settings` environment
variable, set in `manage.py`, `wsgi.py`, and `asgi.py`.

## 2. The problem it solves: config that changes per environment

Your laptop, the CI server, and the production VPS need **different** values
(different database passwords, `DEBUG=True` locally but `False` in production).
Hard-coding these is both insecure (secrets in git) and inflexible.

**Solution: 12-factor configuration.** We read every environment-specific value
from an environment variable using [`django-environ`](https://django-environ.readthedocs.io/):

```python
import environ
env = environ.Env(DEBUG=(bool, False))
environ.Env.read_env(BASE_DIR / ".env")   # load a local .env if present
SECRET_KEY = env("SECRET_KEY", default="...dev only...")
DEBUG = env("DEBUG")
```

- On your machine, values come from `backend/.env` (copied from
  [`.env.example`](../../../backend/.env.example), never committed).
- In production, they come from real environment variables.
- Defaults keep things working with zero setup for quick experiments.

## 3. How it works, section by section

- **Paths** — `BASE_DIR` points at `backend/`. Everything else is relative to it.
- **INSTALLED_APPS** — split into `DJANGO_APPS`, `THIRD_PARTY_APPS`, `LOCAL_APPS`
  so it's obvious what we wrote vs what we pulled in. Each of our apps is listed
  as `"apps.accounts"` etc.
- **DATABASES** — `env.db("DATABASE_URL", default="sqlite://…")`. One env var
  (`DATABASE_URL`) fully describes the connection. Falls back to SQLite so
  `manage.py check` works with no database running.
- **CACHES** — uses Redis if `REDIS_URL` is set, otherwise an in-process cache.
  The app code doesn't care which — that's the point of an abstraction.
- **AUTH_USER_MODEL = "accounts.User"** — tells Django to use *our* user model
  instead of the built-in one. **This must be set before the first migration.**
- **STATIC / MEDIA** — where CSS/JS (`STATIC`) and user uploads (`MEDIA`) live.

## 4. How it interacts with other files

- `manage.py` / `wsgi.py` / `asgi.py` all point `DJANGO_SETTINGS_MODULE` here.
- `DATABASE_URL` / `REDIS_URL` values mirror
  [`infrastructure/docker-compose.dev.yml`](../../../infrastructure/docker-compose.dev.yml).
- `LOCAL_APPS` must list every app that has models, or their tables won't be
  created.

## 5. Common mistakes

- **Committing a real `SECRET_KEY` or `.env`.** Both are git-ignored for a
  reason. Leaking the secret key lets attackers forge sessions.
- **Leaving `DEBUG=True` in production.** It exposes stack traces and settings.
- **Adding an app but forgetting `INSTALLED_APPS`.** Its migrations are ignored.
- **Changing `AUTH_USER_MODEL` after migrating.** Extremely painful; decide up
  front (we did).

## 6. Best practices

- Keep secrets out of code; read them from the environment.
- Provide safe defaults so the project runs out of the box for learning.
- Group and comment settings so newcomers can navigate them.

## 7. Exercises

- **Beginner:** Copy `.env.example` to `.env`, change `DEBUG` to `False`, run
  `manage.py runserver`, and notice the different behavior. Revert.
- **Intermediate:** Point `DATABASE_URL` at the Docker Postgres, `migrate`, and
  confirm the app now uses Postgres (`manage.py dbshell`).

## 8. Interview questions

- **Junior:** Why shouldn't secrets be committed to git?
- **Mid:** Explain 12-factor configuration and how this file implements it.
- **Senior:** What are the risks of swapping `AUTH_USER_MODEL` mid-project and
  how would you migrate an existing DB to a custom user model?
