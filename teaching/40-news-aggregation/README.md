# 40 · News Aggregation

How Flash pulls headlines from other newsrooms (Kenyan + international press and
global news APIs), stores them safely, and lets editors moderate and publish
them — the `apps/aggregation` Django app and the `/dashboard/news-ingestion`
admin panel.

## Lessons

1. [What is news aggregation?](01-what-is-aggregation.md) — the concept: RSS vs
   APIs, why we store *metadata + a link* (not full text), de-duplication, the
   moderation → promotion workflow, diagram, exercises, quiz, interview questions.

## File-paired explainers

- [models-explained.md](project-files/models-explained.md) — `AggregatedArticle`
  & `IngestionRun`.
- [fetchers-explained.md](project-files/fetchers-explained.md) — fetching &
  normalising RSS/API into one shape.
- [services-explained.md](project-files/services-explained.md) — the ingest,
  moderate, and promote-to-`Article` engine.
- [views-explained.md](project-files/views-explained.md) — the staff-only DRF
  admin API.

## Related

- [09-celery](../09-celery/) — the optional scheduled-ingestion task.
- [06-django-rest-framework](../06-django-rest-framework/) — viewsets & actions.
- [12-nextjs/07-dashboard-and-forms.md](../12-nextjs/07-dashboard-and-forms.md) —
  the dashboard patterns the ingestion page builds on.
