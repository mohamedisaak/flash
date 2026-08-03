# `apps/synthesis/views.py` explained

## Why it exists

The HTTP surface for synthesis: let staff check whether the model is ready, run
a synthesis over selected items, and browse job history. Thin — all real work is
in `services.py`.

## Endpoints

Mounted under `/api/v1/synthesis/` (see `urls.py`):

| Method + path | View | Purpose |
|---|---|---|
| `GET status/` | `SynthesisStatusView` | provider/model + enabled flag (banner) |
| `POST jobs/run/` | `SynthesisJobViewSet.run` | synthesise → create draft, return job |
| `GET jobs/` | `SynthesisJobViewSet` | history |
| `DELETE jobs/{id}/` | `SynthesisJobViewSet` | remove a job record |

All require `IsEditorialStaff` — nothing here is public.

## How `run` works

Validates `ids` is a non-empty list of ints (400 otherwise), then calls
`services.synthesize(...)`. A `SynthesisError`/`LLMError` becomes **422
Unprocessable Entity** with the message — a client-actionable problem ("start
Ollama", "the model returned junk"), not a server bug. Success returns the
serialised job (201) including `article_slug`.

## Why synchronous?

Like the ingestion `run` endpoint, synthesis runs **inline** in the request so a
single-VPS deployment works **without a running Celery worker**, and the editor
gets the draft link back immediately. The trade-off: a slow model holds the
request open — keep the gunicorn `--timeout` above `AI_SYNTHESIS_TIMEOUT`. For
newsrooms that prefer to offload, `tasks.synthesize_task` runs the identical
service in the background (the frontend would then poll `GET jobs/{id}/`).

## How it interacts

- `services.synthesize` — the real work.
- `providers.provider_status` — the status endpoint.
- `serializers.SynthesisJobSerializer` — output shape.
- Frontend `web/src/lib/synthesis-api.ts` + the News Ingestion page.

## Common mistakes

- **Returning 500 for a model/prompt failure** — that's a client-actionable
  condition; 422 with the reason is correct.
- **Skipping input validation** — non-int/empty `ids` should 400 before touching
  the service.
- **Making it public** — synthesis costs compute and creates content; staff-only.

## Best practices shown

- Thin views, fat services.
- HTTP status codes that match the *kind* of failure.
- Validate at the boundary; keep the service focused on the happy path + domain
  errors.
