# Database ERD — Flash News Platform (Phase 1)

Entity-Relationship Diagram of the Phase 1 schema. Rendered with Mermaid (GitHub
and most markdown viewers display it natively). Per-table detail lives in
[`teaching/30-database-design/`](../teaching/30-database-design/README.md).

```mermaid
erDiagram
    USER ||--o{ ARTICLE : "authors (PROTECT)"
    USER ||--o{ ARTICLE : "edits (SET_NULL)"
    USER ||--o{ VIDEO : authors
    USER ||--o{ PHOTO_GALLERY : authors
    USER ||--o{ COMMENT : writes
    USER ||--o{ NOTIFICATION : receives
    USER ||--o{ LIVE_BLOG_UPDATE : posts
    USER |o--o{ NEWSLETTER_SUBSCRIBER : "may be"

    CATEGORY ||--o{ CATEGORY : "parent of"
    CATEGORY ||--o{ ARTICLE : contains
    CATEGORY ||--o{ VIDEO : contains
    CATEGORY ||--o{ PHOTO_GALLERY : contains
    CATEGORY ||--o{ LIVE_BLOG : contains

    ARTICLE }o--o{ TAG : tagged
    VIDEO }o--o{ TAG : tagged

    ARTICLE ||--o{ ARTICLE_REVISION : "has history"
    ARTICLE ||--o{ BREAKING_NEWS_ALERT : "may promote"
    ARTICLE ||--o{ COMMENT : receives
    ARTICLE ||--o{ PAGE_VIEW : "measured by"

    COMMENT ||--o{ COMMENT : "replies to (self)"

    LIVE_BLOG ||--o{ LIVE_BLOG_UPDATE : streams
    PHOTO_GALLERY ||--o{ GALLERY_IMAGE : contains

    NEWSLETTER_SUBSCRIBER }o--o{ CATEGORY : "subscribes to"

    USER {
        bigint id PK
        string username UK
        string email UK
        string role
        string status
    }
    CATEGORY {
        bigint id PK
        string name
        string slug UK
        bigint parent_id FK
    }
    TAG {
        bigint id PK
        string name UK
        string slug UK
    }
    ARTICLE {
        bigint id PK
        string title
        string slug UK
        string status
        datetime published_at
        bigint author_id FK
        bigint editor_id FK
        bigint category_id FK
    }
    ARTICLE_REVISION {
        bigint id PK
        bigint article_id FK
        bigint edited_by_id FK
    }
    BREAKING_NEWS_ALERT {
        bigint id PK
        string headline
        bigint article_id FK
        bool is_active
    }
    LIVE_BLOG {
        bigint id PK
        string slug UK
        string status
        bigint category_id FK
    }
    LIVE_BLOG_UPDATE {
        bigint id PK
        bigint live_blog_id FK
        bool is_pinned
    }
    VIDEO {
        bigint id PK
        string slug UK
        bigint category_id FK
        bigint author_id FK
    }
    PHOTO_GALLERY {
        bigint id PK
        string slug UK
        bigint category_id FK
        bigint author_id FK
    }
    GALLERY_IMAGE {
        bigint id PK
        bigint gallery_id FK
        int order
    }
    ADVERTISEMENT {
        bigint id PK
        string placement
        bigint impressions
        bigint clicks
    }
    NEWSLETTER_SUBSCRIBER {
        bigint id PK
        string email UK
        bigint user_id FK
    }
    NOTIFICATION {
        bigint id PK
        bigint recipient_id FK
        string channel
        bool is_read
    }
    COMMENT {
        bigint id PK
        bigint article_id FK
        bigint author_id FK
        bigint parent_id FK
        string status
    }
    PAGE_VIEW {
        bigint id PK
        bigint article_id FK
        string path
    }
    SEARCH_QUERY_LOG {
        bigint id PK
        string query
    }
```

## Legend

- `||--o{` one-to-many · `}o--o{` many-to-many · self-loops = self-referential FK.
- `PK` primary key · `FK` foreign key · `UK` unique.
- `ADVERTISEMENT` and `SEARCH_QUERY_LOG` have no foreign keys to the rest of the
  graph (standalone), so they appear without relationship lines.

## Notes

- The many-to-many links (`ARTICLE ↔ TAG`, `VIDEO ↔ TAG`, `SUBSCRIBER ↔
  CATEGORY`) are realized by hidden join tables Django creates automatically.
- `on_delete` rules are documented per relationship in
  [`teaching/30-database-design/00-conventions.md`](../teaching/30-database-design/00-conventions.md).
