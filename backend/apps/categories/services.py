"""
Category service helpers.

``article_count`` is shown on every ``CategorySerializer`` payload — including
the copy nested inside *every* article/video card. Computing it with a live
``SELECT COUNT(*)`` per serialized row turned one article-list request into
``1 + N`` count queries (one extra per row). This helper removes that cost:

1. If the queryset annotated the count (the standalone ``/categories/``
   endpoint does), we read the annotation — a single grouped query for the
   whole page, always exact.
2. Otherwise (the nested case, where the category arrives via ``select_related``
   on the parent and can't be annotated) we serve the count from the cache,
   computing a miss with one cheap query. A ``post_save``/``post_delete`` signal
   on ``Article`` busts the affected category's key so the number stays correct;
   the TTL is only a backstop for rare edits that don't fire those signals
   (e.g. re-categorising an article, which invalidates the new section
   immediately and the old one within the TTL).

See ``teaching/30-database-design/`` and ``teaching/17-react-query/`` (caching).
"""

from __future__ import annotations

from django.core.cache import cache

# Attribute name the viewset annotates onto Category rows (kept distinct from the
# ``article_count`` serializer field so the two never shadow each other).
ANNOTATION_ATTR = "article_count_annotated"

_CACHE_TTL = 600  # seconds — backstop only; writes invalidate explicitly.


def _key(category_id: int) -> str:
    return f"cat_article_count_{category_id}"


def article_count(category) -> int:
    """Number of articles (all statuses) in ``category``, cheaply."""
    annotated = getattr(category, ANNOTATION_ATTR, None)
    if annotated is not None:
        return annotated
    key = _key(category.pk)
    value = cache.get(key)
    if value is None:
        value = category.articles.count()
        cache.set(key, value, _CACHE_TTL)
    return value


def invalidate(category_id: int) -> None:
    """Drop the cached count for a category after its article set changes."""
    if category_id:
        cache.delete(_key(category_id))
