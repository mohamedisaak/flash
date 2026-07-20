# Database Design

**Status:** 🟢 In progress

Every table in the platform explained: columns, relationships, constraints,
indexes, and query examples — grounded in the real models under
[`backend/apps/`](../../backend/apps/).

## Start here

- [Conventions used in this project](00-conventions.md) — relationship types,
  `on_delete`, indexes, denormalization, enums. **Read this first.**

## Per-table references

| Doc | Covers |
|-----|--------|
| [User & roles](user-and-roles.md) | `accounts_user`, RBAC |
| [Articles](article-tables.md) | `article`, `articlerevision`, `breakingnewsalert` |
| [Live coverage](livecoverage-tables.md) | `liveblog`, `liveblogupdate` |
| [Videos](video-tables.md) | `video` |
| [Galleries](gallery-tables.md) | `photogallery`, `galleryimage` |
| [Ads](ads-tables.md) | `advertisement` |
| [Newsletters](newsletter-tables.md) | `newslettersubscriber` |
| [Notifications](notification-tables.md) | `notification` |
| [Comments](comment-tables.md) | `comment` (threaded) |
| [Analytics](analytics-tables.md) | `pageview`, `searchquerylog` |

Categories & Tags are covered inline in [Articles](article-tables.md) and
[Conventions](00-conventions.md).

## The whole picture

The entity-relationship diagram lives in the project docs:
[`docs/database-erd.md`](../../docs/database-erd.md).

← Back to the [curriculum index](../README.md)
