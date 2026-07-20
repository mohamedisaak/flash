# Tables: Comments

Real code: [`apps/comments/models.py`](../../backend/apps/comments/models.py).

## `comments_comment`
Threaded reader comments with moderation.

| Column | Purpose |
|--------|---------|
| `article_id` | FK→article (CASCADE) |
| `author_id` | FK→user (CASCADE) |
| `parent_id` | **FK→self** (CASCADE) — the comment being replied to; NULL = top-level |
| `body` | the text |
| `status` | enum: pending / approved / rejected / spam (indexed) |
| `report_count` | how many readers flagged it |

**Threading = the self-referential `parent` FK** (an "adjacency list"). Top-level
comments have `parent = NULL`; replies point at their parent. This is the
simplest threading model and is plenty for news-comment depths. Index
`(article, status)` fetches "approved comments for this article" fast.

## Exercises
- **Beginner:** What value does `parent_id` have for a top-level comment?
- **Advanced:** The adjacency list needs one query per level to fetch a deep
  tree. Research alternatives (materialized path, nested set, `django-mptt`) and
  say when they're worth it.

## Interview questions
- **Junior:** How are replies represented?
- **Senior:** Compare adjacency list vs materialized path vs nested set for
  threaded comments.
