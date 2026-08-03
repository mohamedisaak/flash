# `apps/synthesis/services.py` explained

**Concept lessons:** [00 — why synthesis](../00-why-synthesis-not-paraphrase.md),
[02 — prompt design](../02-prompt-design-for-citation.md)

## Why it exists

The orchestration layer: it turns "these aggregated ids" into "a reviewed-ready
draft article + an audit record", tying together sources, prompt, provider,
sanitisation, and persistence. Kept out of the view so it's unit-testable (with
a fake provider) and reusable from the Celery task.

## The pipeline (`synthesize`)

1. Create a `SynthesisJob` (`running`) and attach the source rows.
2. `_gather_sources` — load items in the caller's order; fetch full body on
   demand for any lacking one (reusing `aggregation.services.fetch_full_content`);
   `_strip_html` to plain text for the prompt.
3. `providers.get_provider().generate(system, user_prompt)`.
4. `_parse_output` — tolerant JSON parse (strips ```json fences, falls back to
   the outer `{...}`); requires `title` + `body_html`.
5. `_build_content` — `nh3.clean` the body against a tiny allow-list, then append
   `_citations_html` (outbound credit links).
6. `_create_draft` — persist a **DRAFT** `Article` (self-canonical), best-effort
   lead image, and back-link each source row; **atomic**.
7. Mark the job `success` with model/token/timing metadata + the draft link.

On failure it marks the job `error`, stores the message, and re-raises for the
view to turn into a 422.

## The transaction subtlety (important)

`synthesize` is deliberately **not** `@transaction.atomic`. If the whole
function were atomic, a model failure would roll back the `SynthesisJob` too —
losing the very error record we want. So only `_create_draft` is atomic (Article
+ source back-links commit together), while the job bookkeeping lives outside any
transaction and survives failure. A test (`test_model_error_records_error_job`)
locks this in.

## The safety mechanisms, mapped to lesson 00

| Line of defence | Where | Protects against |
|---|---|---|
| Original-prose prompt | `prompts.SYSTEM_PROMPT` | scraped-content penalty |
| HTML sanitisation | `_build_content` → `nh3.clean` | prompt-injected markup / XSS |
| Kept citations | `_citations_html` | opacity → spam signal |
| Self-canonical | `_create_draft` (blank `canonical_url`) | duplicate-content signal |
| Draft-only | `_create_draft` (`status=DRAFT`) | unreviewed/hallucinated go live |

## How it interacts

- Reuses `aggregation.services` helpers (`fetch_full_content`, `_download_image`,
  `_resolve_category`, `_unique_slug`) so synthesised and verbatim imports behave
  identically.
- Reads `aggregation.AggregatedArticle`, writes `articles.Article` + updates the
  source rows' `imported_article`.
- Called by `views.SynthesisJobViewSet.run` (sync) and `tasks.synthesize_task`
  (async).

## Common mistakes

- Wrapping the whole function in one transaction (see above).
- Rendering model HTML without sanitising — always `nh3.clean`.
- Publishing directly instead of drafting — removes the human backstop.
- Trusting `json.loads` alone — small models add fences/prose; parse tolerantly.

## Best practices shown

- One public entry point; small private helpers.
- Reuse over duplication across sibling apps' service layers.
- Transaction scope chosen for the audit requirement, not by reflex.
