# Tables: Advertisements

Real code: [`apps/ads/models.py`](../../backend/apps/ads/models.py).

## `ads_advertisement`
| Column | Purpose |
|--------|---------|
| `name` | internal label |
| `placement` | enum: header / sidebar / in_content / mobile / popup (indexed) |
| `image` OR `html` | creative (image, or raw ad-network markup) |
| `target_url` | click destination |
| `is_active`, `starts_at`, `ends_at` | scheduling window |
| `impressions`, `clicks` | denormalized counters |

**CTR is not stored** — it's a derived `@property` (`clicks / impressions`) so it
can never disagree with the counters. This is a deliberate normalization choice:
store the raw facts, compute the ratio.

Index `(placement, is_active)` answers "which active ads go in the sidebar?"

## Interview questions
- **Junior:** Why compute CTR instead of storing it?
- **Mid:** How would you count impressions without hammering the DB on every view?
- **Senior:** Design fraud-resistant click tracking.
