# Tables: Analytics

Real code: [`apps/analytics/models.py`](../../backend/apps/analytics/models.py).

First-party, append-only event store we own (so we're not solely dependent on
Google Analytics).

## `analytics_pageview`
| Column | Purpose |
|--------|---------|
| `article_id` | FK→article (CASCADE), optional |
| `path` | the URL viewed (indexed) |
| `session_key` | anonymized session id → estimate unique visitors |
| `referrer`, `source` | where the visit came from (source is a coarse bucket) |
| `read_seconds` | dwell time reported by the client |

## `analytics_searchquerylog`
| Column | Purpose |
|--------|---------|
| `query` | what was searched (indexed) |
| `results_count` | how many hits it returned |
| `session_key` | anonymized session id |

These tables are **high-volume and append-only**. Nightly Celery jobs (Phase 7)
roll them up into summary tables for the analytics dashboard, so we never run
heavy aggregate queries against the raw event tables at read time.

## Interview questions
- **Junior:** Why keep our own analytics if Google Analytics exists?
- **Mid:** Why roll raw events up into summaries instead of querying them live?
- **Senior:** How would you keep this write path cheap at millions of events/day?
