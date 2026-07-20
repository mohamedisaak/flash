# Celery Project Setup (how it's wired here)

**Topic:** Celery · **Level:** Intermediate

## 1. Three files make Celery work

| File | Role |
|------|------|
| [`config/celery.py`](../../backend/config/celery.py) | creates the Celery app, points it at Django settings, auto-discovers tasks |
| [`config/__init__.py`](../../backend/config/__init__.py) | imports that app on Django startup so `@shared_task` binds to it |
| [`config/settings.py`](../../backend/config/settings.py) | the `CELERY_*` config + `CELERY_BEAT_SCHEDULE` |

## 2. The app

```python
# config/celery.py
app = Celery("flash")
app.config_from_object("django.conf:settings", namespace="CELERY")
app.autodiscover_tasks()
```

- `config_from_object(..., namespace="CELERY")` means every Celery setting is
  just a Django setting with a `CELERY_` prefix (`CELERY_BROKER_URL` →
  `broker_url`). One settings file, no duplication.
- `autodiscover_tasks()` finds a `tasks.py` in **every installed app**
  automatically — that's why our tasks live in `apps/<app>/tasks.py` and just
  work.

## 3. Loading it on startup

```python
# config/__init__.py
from .celery import app as celery_app
__all__ = ("celery_app",)
```

Importing here guarantees the app exists whenever Django does, so the
`@shared_task` decorator attaches functions to *our* configured app.

## 4. `@shared_task` vs `@app.task`

We use `@shared_task` in app code:

```python
from celery import shared_task

@shared_task
def publish_scheduled_articles() -> int:
    ...
```

`@shared_task` doesn't import the app object, so app modules stay decoupled from
`config` — better for a modular monolith and reusable apps.

## 5. Settings that matter

```python
CELERY_BROKER_URL = env("CELERY_BROKER_URL", default=_redis_default)
CELERY_RESULT_BACKEND = env("CELERY_RESULT_BACKEND", default=_redis_default)
CELERY_TASK_ALWAYS_EAGER = env.bool("CELERY_TASK_ALWAYS_EAGER", default=False)
```

- **broker** = where tasks are queued; **result backend** = where return
  values/status are stored. Both Redis by default.
- **always-eager** flips tasks to run inline — invaluable for tests.

## 6. Verify it

```bash
uv run python -c "from config.celery import app; app.loader.import_default_modules(); \
  print([t for t in app.tasks if t.startswith('apps.')])"
```

You should see all four project tasks (media, video, articles, analytics).

## 7. Interview questions

- **Junior:** What does `autodiscover_tasks()` save you from doing?
- **Mid:** Why `@shared_task` instead of `@app.task`?
- **Senior:** How does the `CELERY_` settings namespace help configuration
  management across environments?

← [Celery topic index](README.md)
