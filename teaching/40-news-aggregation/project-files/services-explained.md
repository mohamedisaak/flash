# `apps/aggregation/services.py` — explained

The engine. All the *logic* lives here (not the views) so it's unit-testable and
reusable from a Celery task. Three responsibilities.

## 1. `run_ingestion(slugs, max_items, dry_run, user)`

For each chosen source: skip if unavailable (API with no key), else `fetch` and
`_upsert` every item. Errors are caught **per source** and recorded, then an
`IngestionRun` audit row is written and a serialisable summary returned.

`_upsert` is the dedup heart:

```python
AggregatedArticle.objects.update_or_create(
    source=source.slug, external_id=item.external_id, defaults={...}
)
```

On `dry_run` it only *checks existence* to predict created-vs-updated and writes
nothing — perfect for testing a new feed URL.

## 1b. Full-content extraction

`fetch_full_content(agg)` and `bulk_fetch_content(ids)` pull the whole article
via `extract.extract_article` (trafilatura), which returns **`(body, image)`** —
the paragraph HTML *and* the page's og:image. `_extract` first consults the
source registry: a source flagged **`paywalled`** is skipped and returns
`("", "")`, so we never waste a fetch on a hard wall. (None are flagged today —
Nation/Standard turned out to ship the full body in-page; the flag is an escape
hatch for a genuinely gated source.) `import_to_article`
calls the same path so a published/imported post gets the full body when
available, and the feed summary otherwise.

**Lead-image backfill.** Feeds discovered via Google News (e.g. The Star) carry
no image, so `image_url` starts empty. Extraction reads the article page's
`og:image` and, if the feed gave nothing, backfills `agg.image_url` — which
`_download_image` then pulls into the Article's `featured_image`. That's why an
imported Star post now shows a lead image on the site.

## 2. Moderation helpers

`hide_source` / `delete_source` / `delete_all` are thin `QuerySet.update`/
`.delete` wrappers returning affected counts — the bulk-moderation buttons call
straight through.

## 3. `import_to_article(agg, user, publish, category_slug)` — the promotion

Turns an aggregated item into a real editorial `Article`:

- **Idempotent** — if `agg.imported_article_id` is set, return it; never
  double-import.
- **Category** — the admin *chooses* the section at import time; the view passes
  the chosen `category_slug` and `_resolve_category` `get_or_create`s it
  (creating a brand-new section like "world" on demand, humanising the slug into
  a name). If none is chosen it falls back to a default (`world`). This replaced
  an earlier design that derived the category from the source's **region**, which
  silently stamped every Kenyan-source story with a "Kenya" tag — coupling an
  editorial taxonomy decision to a fetch-time attribute the admin couldn't
  override. Lesson: don't infer a user-facing classification from an incidental
  technical field; let the human pick, with a sensible default.
- **Author** — the staff member doing the import (satisfies the `PROTECT` FK).
- **Slug** — `_unique_slug` appends `-2`, `-3`… so two same-titled items can't
  collide on the unique `Article.slug`.
- **Credit, not link** — `Article.source = agg.source_name`; the outbound URL is
  intentionally **not** put in the body (the newsroom's choice).
- **Image** — `_download_image` lazily pulls the remote lead image into the
  `Article.featured_image` field, best-effort (failure just leaves it blank).
- **Status** — `PUBLISHED` + `published_at=now` when `publish`, else `DRAFT`.

Wrapped in `@transaction.atomic` so a half-imported article never persists.

`bulk_import(ids, user, publish)` loops this, skipping already-imported rows.

## Why logic here and not in the view?

The view is a thin HTTP shell; `services` is plain Python. That means the test
suite calls `run_ingestion()`/`import_to_article()` directly (mocking only the
network), and the Celery task
([`tasks.run_scheduled_ingestion`](../../09-celery/)) reuses the exact same code
path a human triggers. One engine, three callers.

## Common mistakes

- **Downloading images at ingestion.** We defer to import time — most items are
  never promoted, so eager downloads waste bandwidth and disk.
- **Forgetting slug collisions.** Two feeds can headline the same event; without
  `_unique_slug` the second import throws `IntegrityError`.
- **Non-atomic import.** Creating the `Article`, then failing to link it back,
  would strand a post; the transaction prevents partial state.

← [Topic index](../README.md)
