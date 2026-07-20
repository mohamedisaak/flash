# The Django Admin

**Topic:** Django · **Level:** Beginner

## 1. The idea in one sentence

> The Django admin is a **free, auto-generated back-office web interface** for
> viewing and editing your database rows — you get it just by registering your
> models.

## 2. Why it matters in Phase 1

We haven't built the REST API or any frontend yet, but we can already **see and
create** every piece of content — users, articles, categories, ads — through the
admin. That's how we verify the database design is correct end-to-end.

## 3. Registering a model

In each app's `admin.py`:

```python
from django.contrib import admin
from .models import Article

@admin.register(Article)
class ArticleAdmin(admin.ModelAdmin):
    list_display = ("title", "author", "status", "published_at")
    list_filter = ("status", "category")
    search_fields = ("title", "content")
    prepopulated_fields = {"slug": ("title",)}
```

- `list_display` — columns in the list view.
- `list_filter` — the filter sidebar.
- `search_fields` — the search box.
- `prepopulated_fields` — auto-fills the slug as you type the title.
- `inlines` — edit child rows (e.g. `GalleryImage`) inside the parent form.

See real examples in
[`apps/articles/admin.py`](../../backend/apps/articles/admin.py) and
[`apps/galleries/admin.py`](../../backend/apps/galleries/admin.py).

## 4. Inlines: editing children with the parent

A `PhotoGallery` has many `GalleryImage` rows. Rather than register `GalleryImage`
on its own, we add it as a `TabularInline` inside `PhotoGalleryAdmin`, so editors
manage the whole gallery on one page. Same pattern for `ArticleRevision` inside
`ArticleAdmin` and `LiveBlogUpdate` inside `LiveBlogAdmin`.

## 5. Try it

```bash
cd backend
uv run python manage.py createsuperuser   # make yourself an admin login
uv run python manage.py runserver
# visit http://127.0.0.1:8000/admin/
```

## 6. Common mistakes

- Registering a model twice → `AlreadyRegistered` error.
- Using `autocomplete_fields` for a related model whose admin has no
  `search_fields` → Django raises an error (autocomplete needs something to
  search). We define `search_fields` on `UserAdmin`, `CategoryAdmin`, `TagAdmin`
  precisely so the article admin's autocomplete works.

## 7. Exercises

- **Beginner:** Create a superuser, log in, and add one `Category` then one
  `Article` in that category.
- **Intermediate:** Add `date_hierarchy = "created_at"` to `TagAdmin` and see the
  date drill-down appear.

## 8. Interview questions

- **Junior:** What is the Django admin useful for, and what is it *not* meant to
  be?
- **Mid:** How do inlines work and when would you use them?

← [Django topic index](README.md)
