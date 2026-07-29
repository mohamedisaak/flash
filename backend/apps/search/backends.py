"""
Search backends behind a common interface.

We define a small ``SearchBackend`` protocol so the rest of the app doesn't care
*how* search works. Today the default is PostgreSQL full-text search (with a
plain-``icontains`` fallback when running on SQLite, so local/dev/tests work with
zero setup). An OpenSearch backend can be dropped in later by flipping
``SEARCH_BACKEND`` — the calling code never changes.

See ``teaching/23-seo/05-search.md``.
"""

from __future__ import annotations

from django.conf import settings
from django.db import connection
from django.db.models import Q, QuerySet

from apps.articles.models import Article


class BaseSearchBackend:
    def search_articles(self, query: str) -> QuerySet:
        raise NotImplementedError

    def autocomplete_titles(self, query: str, limit: int = 8) -> list[str]:
        raise NotImplementedError


class PostgresSearchBackend(BaseSearchBackend):
    """PostgreSQL full-text search, with a portable fallback on other databases.

    On Postgres we build a weighted ``SearchVector`` (title > excerpt > body),
    rank matches with ``SearchRank``, and return them best-first. On SQLite (dev/
    tests) we fall back to a simple case-insensitive substring match so the
    endpoint still works — just without ranking.
    """

    def _base_qs(self) -> QuerySet:
        return Article.published.select_related("author", "category")

    def search_articles(self, query: str) -> QuerySet:
        query = (query or "").strip()
        if not query:
            return self._base_qs().none()

        if connection.vendor == "postgresql":
            from django.contrib.postgres.search import (
                SearchQuery,
                SearchRank,
                SearchVector,
            )

            vector = (
                SearchVector("title", weight="A")
                + SearchVector("excerpt", weight="B")
                + SearchVector("content", weight="C")
            )
            search_query = SearchQuery(query, search_type="websearch")
            return (
                self._base_qs()
                .annotate(rank=SearchRank(vector, search_query))
                .filter(rank__gt=0)
                .order_by("-rank", "-published_at")
            )

        # Fallback (SQLite and friends): unranked substring match.
        return self._base_qs().filter(
            Q(title__icontains=query) | Q(excerpt__icontains=query) | Q(content__icontains=query)
        )

    def autocomplete_titles(self, query: str, limit: int = 8) -> list[str]:
        query = (query or "").strip()
        if not query:
            return []
        titles = (
            self._base_qs()
            .filter(title__icontains=query)
            .order_by("-published_at")
            .values_list("title", flat=True)[:limit]
        )
        return list(titles)


class OpenSearchBackend(BaseSearchBackend):
    """Deferred: a drop-in for large-scale/typo-tolerant search.

    Selected via ``SEARCH_BACKEND=opensearch``. Intentionally not implemented
    yet — the point is that the *interface* is ready, so adding OpenSearch later
    touches only this class, not any view.
    """

    def search_articles(self, query: str) -> QuerySet:  # pragma: no cover
        raise NotImplementedError("OpenSearch backend not configured yet.")

    def autocomplete_titles(self, query: str, limit: int = 8) -> list[str]:  # pragma: no cover
        raise NotImplementedError("OpenSearch backend not configured yet.")


def get_search_backend() -> BaseSearchBackend:
    """Return the configured backend (the only place that knows the choices)."""
    if settings.SEARCH_BACKEND == "opensearch":
        return OpenSearchBackend()
    return PostgresSearchBackend()
