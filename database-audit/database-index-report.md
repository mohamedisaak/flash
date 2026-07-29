# Database Index Report

Every model was inspected for indexes on filtered columns, foreign keys, date
fields, status/boolean flags, search fields, ordering columns, uniqueness, and
composite needs. Django auto-creates a B-tree index on every `ForeignKey` and on
every `unique=True` field, so those are listed as "implicit".

Legend: ✅ present & justified · ➕ added in this audit · 🔻 redundant (recommend
drop) · 💡 recommended addition (not applied — needs judgement/data).

---

## Per-model inventory

### `articles.Article`
| Column(s) | Index | Verdict |
|---|---|---|
| `slug` (unique) | implicit | ✅ slug lookups (`lookup_field="slug"`) |
| `status` | `db_index` | 🔻 **redundant** — covered by the `(status, published_at)` composite's leftmost prefix |
| `published_at` | `db_index` | ✅ staff list orders by `-published_at` across all statuses |
| `is_breaking` | `db_index` | 💡 low selectivity; a partial index would be better |
| `is_featured` | `db_index` | 💡 low selectivity; a partial index would be better |
| `(status, published_at)` | `Meta.indexes` | ✅ the `published` manager (`status=published AND published_at<=now`) + ordering |
| `(category, status)` | `Meta.indexes` | ✅ category pages filtering published articles |
| `author` (FK) | implicit | ✅ `?author=` filter |
| `category` (FK) | implicit | ✅ |
| `created_at` | `db_index` (base) | ✅ ordering fallback |

**Recommendations:**
- 🔻 Drop `db_index=True` on `status` (composite already covers status-only
  filters). Saves one index's write cost on a high-write table. *Not applied* —
  cosmetic write saving, and left to avoid churning a migration for a marginal
  gain; safe to do.
- 💡 Replace the two boolean indexes with **partial** indexes, which are what the
  hero/breaking queries actually want:
  ```python
  models.Index(fields=["published_at"], name="art_featured_partial",
               condition=Q(is_featured=True))
  models.Index(fields=["published_at"], name="art_breaking_partial",
               condition=Q(is_breaking=True))
  ```
  A partial index is tiny (only the few featured/breaking rows) and is far more
  likely to be chosen by the planner than a low-selectivity full boolean index.

### `comments.Comment`
| Column(s) | Index | Verdict |
|---|---|---|
| `(article, status)` | `Meta.indexes` | ✅ exactly the public list filter (`article=…` + `status=approved`) |
| `status` | `db_index` | 🔻 mostly redundant with the composite's… no — composite leads with `article`, so a status-only scan isn't served; keep if status-only queries exist (moderation queue is per-article). Low priority. |
| `article`, `author`, `parent` (FKs) | implicit | ✅ |

### `accounts.User`
| Column(s) | Index | Verdict |
|---|---|---|
| `email` (unique) | implicit | ✅ login by email |
| `username` (unique) | implicit | ✅ |
| `role`, `status` | `db_index` each | ✅ admin `?role=`/`?status=` filters |
| `(role, status)` | `Meta.indexes` | ✅ combined admin filtering |

### `analytics.PageView` (high write volume)
| Column(s) | Index | Verdict |
|---|---|---|
| `path`, `session_key`, `source` | `db_index` each | ✅ dashboard groups/filters by these |
| `created_at` | `db_index` (base) | ✅ every dashboard query is `created_at >= since` + `TruncDate` |
| `(article, created_at)` | `Meta.indexes` | ✅ per-article time series |
| `article` (FK) | implicit | ✅ |

💡 Consider **BRIN** on `created_at` for this append-only table at large scale — a
BRIN index is a fraction of a B-tree's size and ideal for time-ordered inserts.

### `analytics.SearchQueryLog`
`(query, created_at)` composite + `query` `db_index` ✅ for "top searches" window
aggregation.

### `analytics.DailyStat`
`date` unique + `db_index` ✅ (the rollup upsert key).

### `aggregation.AggregatedArticle`
| Column(s) | Index | Verdict |
|---|---|---|
| `(source, external_id)` unique constraint | ✅ de-dup upsert lookup |
| `(source, is_hidden)`, `(region, is_hidden)` | ✅ working-queue filters |
| `source`, `region`, `published_at` | `db_index` each | ✅ |
| `imported_article` (FK) | implicit | ✅ (now `select_related`-ed) |

🔻 `source` single-column `db_index` overlaps the leftmost of `(source,
is_hidden)` — minor redundancy, low priority.

### `notifications.Notification`
| Column(s) | Index | Verdict |
|---|---|---|
| `(recipient, is_read)` | ✅ unread filter |
| `(recipient, -created_at)` | ➕ **added** — the default list scan + sort |
| `is_read`, `channel` | `db_index` | ✅ filters |
| `recipient` (FK) | implicit | ✅ |

### `newsletters.NewsletterSubscriber`
`email` unique ✅, `token` unique ✅ (one-click unsubscribe lookup). `user` FK
implicit. 💡 `is_active` has no index; `send_email` counts active subscribers, but
that's rare/staff-only — not worth an index.

### `categories.Category` / `categories.Tag`
`Category.slug` unique ✅, `(parent, order)` composite ✅ (nav ordering).
`Tag.name`/`Tag.slug` unique ✅. `Category.is_active` unindexed — table is tiny,
fine.

### `ads.Advertisement`
`(placement, is_active)` composite ✅ (the public "active ads for placement"
query). `placement`, `is_active` `db_index` — `placement` single overlaps the
composite leftmost (🔻 minor).

### `videos.Video` / `galleries.PhotoGallery` / `galleries.GalleryImage` / `livecoverage.*`
- `Video.slug`, `PhotoGallery.slug`, `LiveBlog.slug` unique ✅; `published_at`
  `db_index` ✅.
- `GalleryImage (gallery, order)` ✅, `LiveBlogUpdate (live_blog, -created_at)` ✅.
- All FKs implicit ✅.

### `media.ImageRendition`
`unique_together(source_path, size, image_format)` ✅ + extra `source_path`
`db_index`. 🔻 The `unique_together` already indexes `source_path` as its
leftmost column, so the standalone `source_path` index is **redundant** — safe to
drop.

---

## Summary

**Added (applied):**
- `notifications.Notification (recipient, -created_at)` — migration
  `0002_notification_notificatio_recipie_a972ce_idx`.

**Missing indexes:** none critical remain. The schema was already
well-indexed for its query patterns (the real problem was N+1 query *shape*, not
missing indexes — see the performance report).

**Redundant / duplicate indexes (recommend dropping; not applied to avoid
migration churn for marginal write savings):**
- `Article.status` single-column (covered by `(status, published_at)`).
- `AggregatedArticle.source` single-column (covered by `(source, is_hidden)`).
- `Advertisement.placement` single-column (covered by `(placement, is_active)`).
- `ImageRendition.source_path` single-column (covered by the `unique_together`).

**Composite recommendations (not applied):**
- Partial indexes for `Article.is_featured` / `is_breaking` (see above).
- BRIN on `PageView.created_at` at scale.

Dropping the four redundant indexes would remove ~4 index writes per insert on
those tables at zero read cost — worthwhile if write volume is a concern, but each
is individually small.
