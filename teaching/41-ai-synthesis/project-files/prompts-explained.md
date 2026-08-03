# `apps/synthesis/prompts.py` explained

**Concept lesson:** [02 — Prompt design for citation](../02-prompt-design-for-citation.md)

## Why it exists

The prompt *is* the product. It's the difference between original journalism and
scraped-content spam, so it lives in its own file where it can be read, reviewed,
and version-controlled like the critical logic it is.

## What problem it solves

An LLM does exactly what you ask. This file asks for the right thing: original
prose, grounded in supplied facts, with attribution, returned as parseable JSON.

## How it works

- **`SYSTEM_PROMPT`** — a constant string of five hard rules (original prose /
  no invention / attribute / neutral / JSON-only). Constant because the role
  never changes per request.
- **`_OUTPUT_SCHEMA`** — the JSON contract (`title`, `excerpt`, `body_html`,
  `meta_description`) documented in one place so the prompt and the parser can't
  drift.
- **`build_user_prompt(sources, angle)`** — assembles labelled `### SOURCE n`
  blocks (name, headline, URL, body), caps each body at ~6000 chars, injects an
  optional editor `angle`, and restates the JSON schema.

## How it interacts

- `services.synthesize` passes `SYSTEM_PROMPT` and the built user prompt to the
  provider.
- `services._gather_sources` produces the `sources` list of dicts this consumes.
- The `_OUTPUT_SCHEMA` fields are what `services._parse_output` /
  `_create_draft` read back.

## Common mistakes

- **Asking for the sources list in `body_html`** — provenance must not be at the
  model's discretion; the code appends it (`_citations_html`). The prompt
  explicitly tells the model *not* to.
- **No length cap on source bodies** — three long articles overflow the context
  window and the tail gets silently dropped.
- **Trusting the JSON instruction absolutely** — models sometimes wrap or
  prepend text; the parser tolerates that, and `nh3` sanitises regardless.
- **Vague rules** — "write well" does nothing; "never copy or reword source
  sentences; do not invent quotes/numbers" is enforceable behaviour.

## Best practices shown

- Separate stable *role* (system) from per-request *task+data* (user).
- Make the output contract explicit and machine-parseable.
- Keep the untrusted source text in a clearly delimited data section.
- Treat the prompt as reviewable source, not a buried string literal.
