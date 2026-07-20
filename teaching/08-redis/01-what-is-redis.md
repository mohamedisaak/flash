# What is Redis?

**Topic:** Redis · **Level:** Beginner

## 1. The idea in one sentence

> Redis is a blazing-fast, in-memory data store we use for two jobs: a **cache**
> (remember expensive results) and a **message broker** (a queue that hands work
> to background workers).

## 2. Analogy

Postgres is a **warehouse** — durable, organized, but a walk away. Redis is the
**sticky notes on your desk** — tiny, instantly reachable, but not where you keep
anything you can't afford to lose. You keep copies and short-lived things there.

## 3. Two roles in this project

| Role | What it means here |
|------|--------------------|
| **Cache** | Store computed pages/queries briefly so we don't rebuild them every request (used more in later phases). Configured via `CACHES` in settings. |
| **Broker** | Hold the queue of background jobs (resize this image, publish that article). Celery pushes jobs into Redis; workers pull them out. |

Both are wired from one `REDIS_URL` in
[`config/settings.py`](../../backend/config/settings.py). If it's unset, the
cache falls back to local memory and Celery falls back to `localhost` Redis.

## 4. Why in-memory = fast (and the trade-off)

Redis keeps data in RAM, so reads/writes are microseconds. The trade-off: RAM is
volatile and limited. So Redis is perfect for **caches** (losing them just means
recomputing) and **queues** (short-lived messages), but Postgres remains the
durable source of truth.

## 5. Running it

Locally it comes up with the dev stack:

```bash
docker compose -f infrastructure/docker-compose.dev.yml up -d   # starts redis
```

## 6. Interview questions

- **Junior:** What is Redis and why is it fast?
- **Mid:** Give two different uses of Redis in a web app.
- **Senior:** What data should never live *only* in Redis, and why?

← [Redis topic index](README.md)
