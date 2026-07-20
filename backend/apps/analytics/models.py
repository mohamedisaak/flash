"""
First-party analytics — a lightweight event store we own.

Rather than depending only on Google Analytics, we record raw events here so the
internal dashboard (Phase 7) can compute pageviews, top stories, search terms
and traffic sources. These tables are append-only and high-volume; nightly
Celery jobs will roll them up into summary tables later.

- :class:`PageView` — one row per article/page read.
- :class:`SearchQueryLog` — one row per search performed (powers "top search
  terms" and autocomplete quality analysis).

See ``teaching/30-database-design/analytics-tables.md``.
"""

from django.db import models

from apps.common.models import TimeStampedModel


class PageView(TimeStampedModel):
    """A single content view. ``session_key`` lets us estimate unique visitors
    without storing personal data."""

    article = models.ForeignKey(
        "articles.Article",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="pageviews",
    )
    path = models.CharField(max_length=500, db_index=True)
    session_key = models.CharField(max_length=64, blank=True, db_index=True)
    referrer = models.URLField(blank=True)
    # Coarse source bucket derived from the referrer (direct/search/social/etc.).
    source = models.CharField(max_length=32, blank=True, db_index=True)
    read_seconds = models.PositiveIntegerField(default=0, help_text="Dwell time reported by the client.")

    class Meta:
        indexes = [models.Index(fields=["article", "created_at"])]

    def __str__(self) -> str:
        return self.path


class SearchQueryLog(TimeStampedModel):
    query = models.CharField(max_length=255, db_index=True)
    results_count = models.PositiveIntegerField(default=0)
    session_key = models.CharField(max_length=64, blank=True)

    class Meta:
        indexes = [models.Index(fields=["query", "created_at"])]

    def __str__(self) -> str:
        return self.query
