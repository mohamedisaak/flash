# Django Models

**Topic:** Django · **Level:** Beginner → Intermediate
**Prerequisites:** [`03-project-structure.md`](03-project-structure.md)

## 1. The idea in one sentence

> A **model** is a Python class that describes one database table; each attribute
> is a column, and each saved instance is a row.

## 2. Analogy

A model is a **blueprint for a spreadsheet**. The class defines the column
headers (fields) and their rules (types, limits). Every time you save an object,
you add one row to that spreadsheet. Django then talks to the real database for
you so you never write `CREATE TABLE` or `INSERT` by hand.

## 3. A minimal model

```python
from django.db import models

class Tag(models.Model):
    name = models.CharField(max_length=50, unique=True)
    slug = models.SlugField(max_length=60, unique=True)
```

- `class Tag(models.Model)` — inheriting `models.Model` makes it a table.
- `CharField` — a text column; `max_length` becomes a DB constraint.
- `unique=True` — the database rejects duplicate values.

This exact model lives in
[`apps/categories/models.py`](../../backend/apps/categories/models.py).

## 4. Field types you'll see in this project

| Field | Stores | Example in repo |
|-------|--------|-----------------|
| `CharField` | short text | `Article.title` |
| `TextField` | long text | `Article.content` |
| `SlugField` | URL-safe text | `Category.slug` |
| `BooleanField` | true/false | `Article.is_breaking` |
| `DateTimeField` | timestamps | `Article.published_at` |
| `PositiveBigIntegerField` | large counts | `Article.views` |
| `ImageField` / `FileField` | uploaded files | `Video.video_file` |
| `JSONField` | flexible structured data | `User.social_links` |
| `ForeignKey` | link to one other row | `Article.category` |
| `ManyToManyField` | link to many rows | `Article.tags` |

## 5. Abstract base models (DRY fields) — *used heavily here*

Look at [`apps/common/models.py`](../../backend/apps/common/models.py). It
defines two classes with `abstract = True`:

```python
class TimeStampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    class Meta:
        abstract = True
```

`abstract = True` means **no table is created for this class**. Instead other
models *inherit* it to reuse those columns:

```python
class Article(TimeStampedModel, SEOFields):
    ...
```

Now `Article` automatically has `created_at`, `updated_at`, and all the SEO
fields — without repeating them. This is the DRY principle (Don't Repeat
Yourself) applied to the database layer. Almost every table wants
created/updated timestamps, so we define them once.

## 6. `Meta`, `__str__`, and custom `save()`

Most models here include:

- A `class Meta` for table-level options: default `ordering`, database
  `indexes`, `verbose_name`. Example: `Article.Meta.ordering = ("-published_at",)`.
- A `__str__` method so the object shows a human label in the admin/shell
  instead of `<Article object (1)>`.
- Sometimes an overridden `save()` — e.g. auto-filling a `slug` from the title:

  ```python
  def save(self, *args, **kwargs):
      if not self.slug:
          self.slug = slugify(self.title)[:280]
      super().save(*args, **kwargs)
  ```

## 7. Relationships (the big idea)

- `ForeignKey` = **many-to-one**. Many articles belong to one category:
  `category = models.ForeignKey("categories.Category", on_delete=models.PROTECT)`.
- `ManyToManyField` = **many-to-many**. An article has many tags and a tag has
  many articles: `tags = models.ManyToManyField("categories.Tag")`.
- `ForeignKey("self", ...)` = a row linking to another row in the same table —
  we use it for nested categories and threaded comments.

`on_delete` decides what happens when the target is deleted: `PROTECT` (block
it), `CASCADE` (delete children too), `SET_NULL` (blank the link). See
[`30-database-design/00-conventions.md`](../30-database-design/00-conventions.md)
for how we chose each.

## 8. From model to table: migrations

Writing a model doesn't touch the database yet. You run:

```bash
uv run python manage.py makemigrations   # generate a change script
uv run python manage.py migrate          # apply it to the DB
```

Full detail in [`06-migrations.md`](06-migrations.md).

## 9. Common mistakes

- Editing the database by hand instead of via migrations → your models and DB
  drift apart.
- Using `CASCADE` on an author FK → deleting a user silently deletes their
  articles. We deliberately use `PROTECT` for authors.
- Forgetting `max_length` on `CharField` → Django won't let you migrate.

## 10. Exercises

### Beginner
1. Open `apps/categories/models.py`. Which field guarantees no two tags share a
   name?
2. Which base classes does `Article` inherit, and what does each add?

### Intermediate
1. Add a `PositiveIntegerField` called `comment_count` (default 0) to `Article`,
   make the migration, apply it, then revert by removing it and migrating again.
2. Explain why `Article.author` uses `on_delete=models.PROTECT` and not
   `CASCADE`.

### Advanced
1. `Article.published` is a *custom manager*. Read it in `models.py` and explain
   what `Article.published.all()` returns vs `Article.objects.all()`.

<details><summary>Solutions</summary>

- B1: `name = models.CharField(max_length=50, unique=True)` (and `slug` too).
- B2: `TimeStampedModel` (created/updated timestamps) and `SEOFields` (seo_title,
  meta_description, keywords, canonical_url, og_image).
- I2: To avoid silently destroying published journalism when an account is
  removed; PROTECT forces you to reassign first.
- A1: `published` filters to `status="published"` AND `published_at <= now`, so
  it hides drafts and future-scheduled posts; `objects` returns everything.

</details>

## 11. Quiz

- **MCQ:** `abstract = True` in `Meta` means… (a) the model is read-only (b) no
  table is created; it's for inheritance (c) it's hidden from admin. *(b)*
- **True/False:** A `ManyToManyField` creates a hidden join table. *(True)*

## 12. Interview questions

- **Junior:** What is a Django model and how does it relate to a database table?
- **Mid:** Explain `on_delete` options and when you'd use each.
- **Senior:** What are the trade-offs of denormalized counter columns (like
  `Article.views`) versus computing counts on read?

← [Django topic index](README.md)
