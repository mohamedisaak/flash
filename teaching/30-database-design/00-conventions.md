# Database Design — Conventions Used in This Project

**Status:** 🟢 In progress

This is the "house style" for our schema. Every table doc in this folder assumes
these conventions.

## 1. Relationship types (the vocabulary)

| Type | Meaning | Django field | Example here |
|------|---------|--------------|--------------|
| One-to-many | one parent row, many child rows | `ForeignKey` on the child | one Category → many Articles |
| Many-to-many | rows on both sides link freely | `ManyToManyField` | Articles ↔ Tags |
| One-to-one | exactly one row each side | `OneToOneField` | (none yet) |
| Self-referential | a row links to another row in the same table | `ForeignKey("self")` | Category→parent, Comment→parent |

> **One-to-many read as a sentence:** "Many articles belong to one category."
> The `ForeignKey` always lives on the *many* side (the article).
>
> **Many-to-many:** Django silently creates a hidden **join table** with two
> foreign keys to connect the sides. You never write that table yourself.

## 2. `on_delete` — what happens to children when a parent is deleted

| Choice | Effect | We use it for |
|--------|--------|---------------|
| `PROTECT` | block the delete | `author`, `category` — never lose journalism silently |
| `CASCADE` | delete the children too | `ArticleRevision`, `GalleryImage`, `Comment` replies |
| `SET_NULL` | blank the link, keep the row | optional `editor`, `newsletter.user` |

Rule of thumb: **PROTECT** for links you must not lose by accident; **CASCADE**
for rows that are meaningless without their parent; **SET_NULL** for optional
links.

## 3. Timestamps everywhere

Nearly every table inherits `TimeStampedModel`
([`apps/common/models.py`](../../backend/apps/common/models.py)) giving
`created_at` and `updated_at`. This is invaluable for debugging, sorting, and
auditing.

## 4. SEO fields as a mixin

Publicly indexable tables (articles, categories, videos, galleries, live blogs)
inherit `SEOFields`, so on-page SEO controls are consistent everywhere instead of
copy-pasted.

## 5. Slugs for URLs

Content tables have a `slug` (`unique=True`) — the URL-safe identifier used in
addresses like `/politics/some-story`. Auto-generated from the title in `save()`
when not provided.

## 6. Indexes: make hot queries fast

An **index** is like a book's index — it lets the database jump straight to
matching rows instead of scanning the whole table. We add:

- `db_index=True` on single columns we filter/sort by a lot (`status`,
  `published_at`, `created_at`).
- `Meta.indexes` composite indexes for multi-column queries the app actually
  runs (e.g. `(category, status)` for category pages).

Indexes speed up reads but slightly slow writes and use space — so we index
deliberately, based on real query patterns, not "just in case."

## 7. Denormalized counters

`Article.views/shares/reactions` and `Advertisement.impressions/clicks` are
stored on the row (denormalized) for cheap reads at news-site scale, and updated
in the background. `Advertisement.ctr` is the opposite — a *derived* property,
never stored, so it can't drift.

## 8. Enumerations via `TextChoices`

Fixed sets of values (article status, user role, ad placement) use
`models.TextChoices`. They store a short string in the DB but present a friendly
label in forms/admin — keeping allowed values in one authoritative place.

## Per-table references

- [User & roles](user-and-roles.md)
- [Article tables](article-tables.md)
- [Live coverage tables](livecoverage-tables.md)
- [Video tables](video-tables.md)
- [Gallery tables](gallery-tables.md)
- [Ads tables](ads-tables.md)
- [Newsletter tables](newsletter-tables.md)
- [Notification tables](notification-tables.md)
- [Comment tables](comment-tables.md)
- [Analytics tables](analytics-tables.md)

See the full picture in the ERD: [`docs/database-erd.md`](../../docs/database-erd.md).

← Back to the [Database Design index](README.md)
