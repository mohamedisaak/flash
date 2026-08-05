"""
Storage for aggregated (ingested) news.

Two models:

- :class:`AggregatedArticle` — one headline pulled from an external source. We
  store only *metadata + a link back*: title, summary, image URL, author, the
  original ``url`` and ``published_at``. This is deliberately **not** a copy of
  the full article — it's a syndication record, the same shape RSS itself
  provides. Editors moderate these (hide/delete by source) and can turn one into
  a real editorial :class:`~apps.articles.models.Article` — either a draft to
  rewrite, or a published post (with a source *credit* but no outbound link).

- :class:`IngestionRun` — an audit row per ingestion, powering the run-history
  panel and letting us show what each run created/updated/skipped.

Nothing here is public: the aggregation store lives entirely behind the admin.
The public site only ever sees the editorial ``Article`` rows an editor chose to
publish from it.

See ``teaching/40-news-aggregation/project-files/models-explained.md``.
"""

from django.conf import settings
from django.db import models

from apps.common.models import TimeStampedModel

from .sources import SourceRegion


class AggregatedArticle(TimeStampedModel):
    # --- Provenance ---
    source = models.CharField(max_length=64, db_index=True, help_text="Source slug, e.g. 'nation'.")
    source_name = models.CharField(
        max_length=120, help_text="Human-readable source, e.g. 'Nation Africa'."
    )
    region = models.CharField(max_length=16, choices=SourceRegion.CHOICES, db_index=True)
    # Editorial section this item was crawled for (e.g. "sports"), when it came
    # from a category-scoped crawl. Blank for whole-site feeds. Used to auto-file
    # the post into the right section on import/synthesis.
    category = models.CharField(max_length=50, blank=True, db_index=True)
    # Stable per-source identity for de-duplication (RSS guid, or the URL).
    external_id = models.CharField(max_length=500)

    # --- Syndicated content (metadata only) ---
    url = models.URLField(max_length=1000, help_text="Canonical link to the original story.")
    title = models.CharField(max_length=500)
    summary = models.TextField(blank=True, help_text="Short standfirst/summary from the feed.")
    # Full article body (clean paragraph HTML) extracted on demand from `url`.
    # Empty until fetched, or when the page is paywalled/gated.
    content = models.TextField(blank=True, help_text="Extracted full-article HTML, if fetched.")
    content_fetched = models.BooleanField(
        default=False, help_text="Full-content extraction has been attempted."
    )
    author = models.CharField(max_length=200, blank=True)
    image_url = models.URLField(
        max_length=1000, blank=True, help_text="Remote lead image, if the feed provides one."
    )
    published_at = models.DateTimeField(null=True, blank=True, db_index=True)

    # --- Moderation / lifecycle ---
    is_hidden = models.BooleanField(
        default=False, db_index=True, help_text="Excluded from the working queue."
    )
    imported_article = models.ForeignKey(
        "articles.Article",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="+",
        help_text="Set once this item has been imported into an editorial Article.",
    )
    imported_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ("-published_at", "-created_at")
        constraints = [
            models.UniqueConstraint(
                fields=["source", "external_id"], name="uniq_agg_source_external"
            ),
        ]
        indexes = [
            models.Index(fields=["source", "is_hidden"]),
            models.Index(fields=["region", "is_hidden"]),
        ]

    def __str__(self) -> str:
        return f"[{self.source}] {self.title[:60]}"

    @property
    def is_imported(self) -> bool:
        return self.imported_article_id is not None


class IngestionRun(TimeStampedModel):
    """An audit record for one ingestion invocation (admin-triggered)."""

    sources = models.JSONField(default=list, help_text="Source slugs included in this run.")
    dry_run = models.BooleanField(default=False)
    created_count = models.PositiveIntegerField(default=0)
    updated_count = models.PositiveIntegerField(default=0)
    skipped_count = models.PositiveIntegerField(default=0)
    error_count = models.PositiveIntegerField(default=0)
    # Per-source breakdown: {slug: {created, updated, skipped, error, message}}.
    detail = models.JSONField(default=dict)
    message = models.CharField(max_length=500, blank=True)
    triggered_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="ingestion_runs",
    )

    class Meta:
        ordering = ("-created_at",)

    def __str__(self) -> str:
        kind = "dry-run" if self.dry_run else "run"
        return f"Ingestion {kind} #{self.pk} (+{self.created_count}/~{self.updated_count})"
