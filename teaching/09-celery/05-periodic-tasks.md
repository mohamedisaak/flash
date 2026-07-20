# Periodic Tasks (Celery Beat)

**Topic:** Celery · **Level:** Intermediate

## 1. The idea in one sentence

> **Celery beat** is a scheduler that enqueues certain tasks on a clock — every
> minute, nightly, etc. — so work happens without anyone triggering it.

## 2. Analogy

Beat is an **alarm clock** wired to the kitchen. At set times it drops a ticket
on the order rail (broker); a worker then cooks it. Beat only *schedules*; workers
still do the work.

## 3. The schedule

[`config/settings.py`](../../backend/config/settings.py):

```python
CELERY_BEAT_SCHEDULE = {
    "publish-scheduled-articles": {
        "task": "apps.articles.tasks.publish_scheduled_articles",
        "schedule": 60.0,                       # every 60 seconds
    },
    "aggregate-daily-analytics": {
        "task": "apps.analytics.tasks.aggregate_daily_analytics",
        "schedule": crontab(minute=15, hour=0), # daily at 00:15
    },
}
```

`schedule` can be a number of seconds or a `crontab(...)` for calendar-style
timing.

## 4. Task 1: scheduled publishing

[`apps/articles/tasks.py`](../../backend/apps/articles/tasks.py):

```python
Article.objects.filter(
    status=ArticleStatus.SCHEDULED, published_at__lte=now
).update(status=ArticleStatus.PUBLISHED)
```

An editor schedules a story for 6 AM. Every minute, beat runs this; the moment
`published_at` is in the past, the article flips to Published. One DB `UPDATE`,
no per-row Python loop.

## 5. Task 2: analytics rollup

[`apps/analytics/tasks.py`](../../backend/apps/analytics/tasks.py) turns millions
of raw `PageView` rows into one `DailyStat` per day. The dashboard then reads
summaries, not raw events — the **raw events → summary tables** pattern. It uses
`update_or_create`, so re-running is safe (idempotent). A test asserts running it
twice doesn't duplicate the day.

## 6. Running beat

```bash
uv run celery -A config beat -l info      # the scheduler
uv run celery -A config worker -l info    # a worker to run what beat enqueues
```

You need **both**: beat schedules, workers execute.

## 7. Common mistakes

- Running beat but no worker → tickets pile up, nothing executes.
- Non-idempotent periodic tasks → duplicates when they overlap or retry. Design
  them to be safe to re-run (both of ours are).
- Long tasks scheduled more often than they finish → pile-ups. Keep periodic
  tasks quick or guard against overlap.

## 8. Exercises

- **Beginner:** When exactly does `aggregate-daily-analytics` run?
- **Intermediate:** Add a periodic task that deletes `PageView` rows older than
  90 days, and schedule it weekly.
- **Advanced:** `publish_scheduled_articles` runs every minute — how would you
  make publishing feel instant *and* keep the safety-net schedule?

## 9. Interview questions

- **Junior:** What is Celery beat?
- **Mid:** Why must periodic tasks be idempotent?
- **Senior:** Compare a static `CELERY_BEAT_SCHEDULE` vs a database-backed
  scheduler (django-celery-beat) for a team that edits schedules often.

← [Celery topic index](README.md)
