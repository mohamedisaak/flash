# `apps/aggregation/views.py` — explained

The staff-only HTTP surface. Every endpoint requires `IsEditorialStaff`; nothing
here is public. The views are deliberately **thin** — they parse the request,
call [`services`](services-explained.md), and return the result.

## Two viewsets

### `AggregatedArticleViewSet`

Built from mixins (`List` + `Retrieve` + `Destroy`) rather than a full
`ModelViewSet`, because these rows aren't *created/edited* over HTTP — they're
ingested. On top of listing/filtering (`source`, `region`, `is_hidden`, search),
it hangs the actions the panel needs:

| Action | Route | Purpose |
|---|---|---|
| `sources` | `GET items/sources/` | the registry + per-source counts + availability |
| `stats` | `GET items/stats/` | totals for the header |
| `run` | `POST items/run/` | run ingestion, return summary |
| `bulk` | `POST items/bulk/` | `{action, ids, category}` — publish/import/fetch_content/hide/unhide/delete |
| `hide_source` / `delete_source` / `delete_all` | `POST …` | source-level moderation |
| `hide` / `unhide` / `fetch_content` / `import_item` | `POST items/{id}/…/` | per-row actions |

The `retrieve` view swaps to `AggregatedArticleDetailSerializer` so a single item
returns its full extracted `content` (for the admin preview), while list stays
light with just a `has_content` boolean.

`@action(detail=False)` gives collection routes (`items/run/`); `detail=True`
gives per-row routes (`items/5/hide/`). Note `import_item` uses
`url_path="import"` because `import` is a reserved word in Python.

### `IngestionRunViewSet`

`List` + `Destroy` + a `clear` action to wipe history.

## Why a synchronous `run`?

`run` executes ingestion inside the request and returns the report, so the admin
sees results immediately (like the reference job-board panel). For ~10 feeds
that's a few seconds. If a newsroom later wants scheduled pulls, the identical
logic is already a Celery task — the view just wouldn't be the trigger.

## The permission boundary

`permission_classes = [IsEditorialStaff]` on both viewsets is the *real* security
line (the dashboard hiding the nav link is only UX). An anonymous or subscriber
token gets `403` on every route — see the test
`test_endpoints_require_staff`.

## Common mistakes

- **Returning ORM objects.** Actions return plain dicts / serializer data, never
  a model instance.
- **Doing work in the view.** Keep orchestration in `services`; the view should
  read like a table of contents.
- **Exposing this publicly.** Mount it under the staff API only; there is no
  `ReadOnly` variant on purpose.

← [Topic index](../README.md)
