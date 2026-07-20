# Celery

**Status:** 🟢 In progress

Background and scheduled tasks — the media pipelines, scheduled publishing, and
analytics rollups built in Phase 3.

## Lessons

1. [What is Celery?](01-what-is-celery.md)
2. [Project setup (how it's wired here)](02-project-setup.md)
3. [The image pipeline (Pillow + Celery)](03-image-pipeline.md)
4. [The video pipeline (FFmpeg + Celery)](04-video-pipeline.md)
5. [Periodic tasks (Celery beat)](05-periodic-tasks.md)

## Related

- The queue it runs on: [`../08-redis/`](../08-redis/README.md)
- The tables it fills: [`../30-database-design/analytics-tables.md`](../30-database-design/analytics-tables.md)

← Back to the [curriculum index](../README.md)
