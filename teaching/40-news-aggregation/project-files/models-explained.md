# `apps/aggregation/models.py` — explained

Two models back the whole feature.

## `AggregatedArticle` — one syndicated headline

Stores **metadata + a link**, never full article text (see
[the concept lesson §1](../01-what-is-aggregation.md)). Field groups:

- **Provenance** — `source` (slug, e.g. `nation`), `source_name`, `region`, and
  `external_id` (the feed's `guid`, or the URL). `external_id` is the dedup key.
- **Content** — `url`, `title`, `summary`, `author`, `image_url` (a *remote* URL,
  not an uploaded file), `published_at`. Plus `content` (the full extracted
  article body as clean paragraph HTML, empty until fetched) and
  `content_fetched` (whether extraction was attempted — distinguishes "not tried"
  from "tried, but the page was gated/empty").
- **Lifecycle** — `is_hidden` (moderation), `imported_article` (FK to the
  editorial `Article` created from it, or null), `imported_at`.

### The one constraint that matters

```python
constraints = [
    models.UniqueConstraint(fields=["source", "external_id"], name="uniq_agg_source_external"),
]
```

This is what makes re-ingestion safe: the same story from the same source can
exist only once. Combined with `update_or_create`, a re-run refreshes rows
instead of duplicating them.

### Why `image_url` is a URL, not an `ImageField`

Feeds give us a remote image address. We don't download it at ingestion time
(that's a lot of bytes for items nobody may ever use). The download happens
*lazily* — only when an editor imports the item — in
[`services._download_image`](services-explained.md).

### Why link back to `Article` instead of copying fields

`imported_article` is a foreign key, so from any aggregated row we can tell
whether it's been promoted and jump to the resulting post — and the admin can
grey-out its "Publish" button. Deleting the aggregated row later doesn't touch
the published article (`on_delete=SET_NULL`).

## `IngestionRun` — an audit row per run

Every ingestion (including dry-runs) writes one: which `sources`, the
`created/updated/skipped/error` counts, a per-source `detail` JSON blob, and
`triggered_by`. It powers the "Recent runs" panel and answers "what did last
night's pull actually do?".

## Common mistakes

- **Making it public.** Nothing here has a public serializer/route — the store
  is staff-only by design. Public readers only ever see promoted `Article`s.
- **Dedup in Python.** Don't "check then insert" in app code (races). Let the DB
  constraint + `update_or_create` guarantee it.
- **Storing full `content`.** Keep it to `summary`; republishing the body is the
  copyright line you don't cross.

← [Topic index](../README.md)
