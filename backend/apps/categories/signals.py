"""
Cache-invalidation signals for category article counts.

Whenever an article is created, deleted, or moved between sections, the cached
``article_count`` for the affected category is stale. We bust it here so
:func:`apps.categories.services.article_count` recomputes exactly once on the
next read instead of on every serialized row.

Connected in :meth:`CategoriesConfig.ready`. We resolve the ``Article`` model
lazily via ``apps.get_model`` so the categories app never imports the articles
app at module load (keeping the modular-monolith boundary intact — see
``CLAUDE.md`` "Engineering rules").
"""

from __future__ import annotations

from django.db.models.signals import post_delete, post_save

from .services import invalidate


def _bust_article_count(sender, instance, **kwargs) -> None:
    invalidate(getattr(instance, "category_id", None))


def connect() -> None:
    from django.apps import apps

    article_model = apps.get_model("articles", "Article")
    post_save.connect(
        _bust_article_count, sender=article_model, dispatch_uid="cat_count_on_article_save"
    )
    post_delete.connect(
        _bust_article_count, sender=article_model, dispatch_uid="cat_count_on_article_delete"
    )
