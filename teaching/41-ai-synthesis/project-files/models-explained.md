# `apps/synthesis/models.py` explained

## Why it exists

Every synthesis attempt needs an audit row: what went in, which model ran, how
it went, what came out. `SynthesisJob` is that row — provenance, debugging, and
a teaching example of the job/audit-table pattern in one model.

## What problem it solves

- **Provenance/trust** — you can always show which external reports a piece was
  synthesised from (the whole point of doing it the safe way).
- **Debugging** — a failed run keeps its `error` and inputs, so it's
  reproducible.
- **Observability** — timing and token counts per run.

## How it works

Fields group into three:

- **Inputs** — `sources` (M2M to `aggregation.AggregatedArticle`), `angle`,
  `category_slug`.
- **Execution** — `status` (pending/running/success/error), `provider`,
  `model`, `prompt_tokens`, `completion_tokens`, `duration_ms`, `error`.
- **Output** — `article` (FK to `articles.Article`, `SET_NULL`), `created_by`.

Inherits `TimeStampedModel` (`created_at`/`updated_at`) and indexes
`(status, created_at)` for history queries.

## How it interacts

- `services.synthesize` creates it `running`, sets `sources`, then marks it
  `success`+links the draft, or `error`+stores the message.
- `serializers.SynthesisJobSerializer` exposes it (adding `article_slug`,
  `article_title`).
- `admin.SynthesisJobAdmin` makes it read-only in Django admin.

## Cross-app relations — is this allowed?

Yes. The engineering rule is "no cross-app model *imports* for reuse"; a
declared **relation** by string (`"aggregation.AggregatedArticle"`,
`"articles.Article"`) is the sanctioned way apps connect — the same pattern
`aggregation.AggregatedArticle.imported_article` already uses to point at
`articles.Article`.

## Common mistakes

- **`on_delete=CASCADE` on `article`** — deleting a draft would delete its audit
  history. `SET_NULL` keeps the record (with the timing/error) even if the draft
  is later removed.
- **Storing source ids as a JSON list** — loses referential integrity and makes
  "which drafts used this item?" un-queryable. A real M2M is worth it.
- **Not recording failures** — the row must persist on error; that's why
  `synthesize` keeps the job write *outside* the atomic block (see
  services-explained).

## Best practices shown

- Audit rows survive their referents (`SET_NULL`).
- Index the columns you filter/sort by (`status`, `created_at`).
- Relations by string reference across apps.
