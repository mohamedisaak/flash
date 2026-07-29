# Tables: Advertisements

Real code: [`apps/ads/models.py`](../../backend/apps/ads/models.py).

## `ads_advertisement`
| Column | Purpose |
|--------|---------|
| `name` | internal label |
| `placement` | enum: header / sidebar / in_content / mobile / popup (indexed) |
| `image` OR `html` | creative (image, or raw ad-network markup) |
| `target_url` | click destination |
| `left_text`, `right_text` | banner side text: words filling the space beside a centered image |
| `overlay_text`, `overlay_position` | caption drawn on top of the image (top/center/bottom) |
| `image_fit` | enum: `contain` (whole image) / `cover` (fill the slot, may crop) |
| `effect` | enum: none / pulse / glow / blink — attention animation |
| `is_active`, `starts_at`, `ends_at` | scheduling window |
| `impressions`, `clicks` | denormalized counters |

**Presentation fields with a runtime rule.** `left_text`/`right_text` and
`overlay_text` are *mutually exclusive at render time*: the frontend uses side
text when either is set, and only falls back to the overlay caption otherwise.
The database stores both independently (all `blank=True`) — it's the
[`Ad` component](../../web/src/components/public/ad.tsx) that enforces the
"side text wins" precedence. Keeping the rule in the render layer, not the
schema, means an editor can fill in both and freely switch which one is active
by clearing the other, without a migration or a constraint.

**CTR is not stored** — it's a derived `@property` (`clicks / impressions`) so it
can never disagree with the counters. This is a deliberate normalization choice:
store the raw facts, compute the ratio.

Index `(placement, is_active)` answers "which active ads go in the sidebar?"

## Interview questions
- **Junior:** Why compute CTR instead of storing it?
- **Mid:** How would you count impressions without hammering the DB on every view?
- **Senior:** Design fraud-resistant click tracking.
