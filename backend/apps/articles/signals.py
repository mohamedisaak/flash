"""
Article → frontend cache invalidation.

When an article is published, edited, or deleted, purge the public pages that
show it so the change appears immediately — even though those pages are now ISR
(cached) rather than rendered on every request. We target just the affected
paths: the homepage, the article's own page, and its category page.

Fires on ``transaction.on_commit`` so the purge goes out only after the row is
committed (otherwise the frontend could re-render and read stale data).
Revalidation is best-effort (see :func:`apps.common.revalidate.trigger_revalidate`).
"""

from django.db import transaction
from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from apps.common.revalidate import trigger_revalidate

from .models import Article


def _paths_for(article: Article) -> list[str]:
    paths = ["/", f"/articles/{article.slug}"]
    category = getattr(article, "category", None)
    if category is not None and category.slug:
        paths.append(f"/{category.slug}")
    return paths


@receiver(post_save, sender=Article)
@receiver(post_delete, sender=Article)
def _article_changed(instance, **kwargs):
    paths = _paths_for(instance)
    transaction.on_commit(lambda: trigger_revalidate(paths=paths))
