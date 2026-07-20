# The `Article` Model — Explained

A deep dive on the most important table in the platform. Real code:
[`backend/apps/articles/models.py`](../../../backend/apps/articles/models.py).

## 1. Why it exists

An article is the core product of a news site. Everything else — categories,
tags, comments, SEO, analytics — orbits it. This model captures both the
*content* and the *editorial workflow* of a story.

## 2. Anatomy

```python
class Article(TimeStampedModel, SEOFields):
    title = models.CharField(max_length=255)
    subtitle = models.CharField(max_length=255, blank=True)
    slug = models.SlugField(max_length=280, unique=True)
    excerpt = models.TextField(blank=True)
    content = models.TextField(blank=True)
    ...
```

It inherits:
- `TimeStampedModel` → `created_at`, `updated_at`.
- `SEOFields` → `seo_title`, `meta_description`, `meta_keywords`,
  `canonical_url`, `og_image`.

### Relationships
- `author` → `ForeignKey(User, on_delete=PROTECT)`: every article has exactly
  one author; PROTECT stops you from deleting a user who still has articles.
- `editor` → `ForeignKey(User, SET_NULL, null=True)`: optional; if the editor's
  account is removed, the article survives with a blank editor.
- `category` → `ForeignKey(Category, PROTECT)`: exactly one section.
- `tags` → `ManyToManyField(Tag)`: zero or many labels.

### Workflow
- `status` uses the `ArticleStatus` enum: Draft → Review → Scheduled → Published
  → Archived.
- `published_at` is the go-live timestamp. A **future** value + `scheduled`
  status = a post that publishes later.

### Engagement counters
`views`, `shares`, `reactions`, `reading_time` are **denormalized** — stored
directly on the row so reads are cheap. They're updated asynchronously (Phase 3)
rather than computed on every page load.

## 3. Two managers: `objects` vs `published`

```python
objects = models.Manager()             # everything, incl. drafts
published = PublishedArticleManager()  # only live articles
```

`Article.published.all()` returns only rows that are `status="published"` **and**
`published_at <= now`. The public website/API uses `published`; the newsroom
dashboard uses `objects`. Centralizing the "is it live?" rule in one manager
means we never accidentally leak a draft.

## 4. The custom `save()`

If no slug was provided, one is generated from the title with `slugify()` so URLs
are always clean and unique-friendly. `super().save()` then does the real write.

## 5. Indexes (why the `Meta.indexes`)

```python
indexes = [
    models.Index(fields=["status", "published_at"]),
    models.Index(fields=["category", "status"]),
]
```

The homepage asks "give me published articles by date" and category pages ask
"published articles in this category." These composite indexes make those exact
queries fast at scale. More on indexes in
[`../../30-database-design/article-tables.md`](../../30-database-design/article-tables.md).

## 6. How it connects

- `Comment` (comments app) → FK to Article.
- `ArticleRevision` → FK to Article (history/draft recovery).
- `BreakingNewsAlert` → optional FK to Article.
- `PageView` (analytics) → optional FK to Article.
- Frontend renders Schema.org **NewsArticle** structured data from these fields
  (Phase 4/5).

## 7. Common mistakes

- Querying `Article.objects` on public pages and leaking drafts — use
  `Article.published`.
- Using `CASCADE` on `author` — would delete real journalism when an account is
  removed. We use `PROTECT`.
- Forgetting that scheduled posts are just "published status + future
  `published_at`"; the `published` manager already handles the time check.

## 8. Exercises

- **Beginner:** In the Django shell, create a category, a user, and a draft
  article. Confirm `Article.published.count()` is 0 but `Article.objects.count()`
  is 1.
- **Intermediate:** Set the article's `status="published"` and `published_at` to
  now, save, and re-check both counts.
- **Advanced:** Give it a *future* `published_at`. Why does `published` still
  exclude it? Trace the manager's queryset.

## 9. Interview questions

- **Junior:** What is a slug and why store one?
- **Mid:** What is a model manager and why have a separate `published` one?
- **Senior:** Discuss the trade-offs of denormalized `views`/`shares` counters
  vs. deriving them from an events table, and how you'd keep them accurate under
  high traffic.
