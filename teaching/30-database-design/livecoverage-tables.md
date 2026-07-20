# Tables: Live Coverage

Real code: [`apps/livecoverage/models.py`](../../backend/apps/livecoverage/models.py).

## `livecoverage_liveblog`
The container for a running event (election night, a match, an emergency).

| Column | Purpose |
|--------|---------|
| `title`, `slug`, `summary` | identity + URL |
| `category_id` | FK→category (PROTECT) |
| `status` | enum: upcoming / live / ended |
| `starts_at`, `ended_at` | event window |
| + SEOFields + TimeStampedModel | metadata + timestamps |

## `livecoverage_liveblogupdate`
One timestamped post in the blog's timeline (one-to-many from LiveBlog).

| Column | Purpose |
|--------|---------|
| `live_blog_id` | FK→liveblog (**CASCADE**) |
| `author_id` | FK→user (SET_NULL) |
| `headline`, `body` | the update |
| `is_pinned` | keep a key update (e.g. final result) at the top |

Ordering is `(-is_pinned, -created_at)` so pinned items lead, then newest first.
Index `(live_blog, -created_at)` powers the "give me the latest updates" query
the frontend polls for. Real-time delivery is discussed in
[`../29-system-design/`](../29-system-design/README.md).

## Interview questions
- **Junior:** What is the one-to-many relationship here?
- **Mid:** How would a reader's browser see new updates "live" without WebSockets?
- **Senior:** Compare polling vs SSE vs WebSockets for this feature.
