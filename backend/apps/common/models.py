"""
Shared abstract base models.

These classes have ``abstract = True`` in their ``Meta``, which means Django
does NOT create a database table for them. Instead, other models inherit from
them to reuse the same columns without duplicating field definitions. This is
the DRY principle applied to the data layer.

See ``teaching/05-django/05-models.md`` and
``teaching/30-database-design/00-conventions.md`` for the full explanation.
"""

from django.db import models


class TimeStampedModel(models.Model):
    """Adds ``created_at`` / ``updated_at`` to any model that inherits it.

    ``auto_now_add`` stamps the row once, at INSERT.
    ``auto_now`` re-stamps on every SAVE.
    Almost every table in the system wants these, so we define them once here.
    """

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class SEOFields(models.Model):
    """Reusable on-page SEO metadata.

    Any publicly indexable entity (article, category, video, gallery) mixes
    this in so search engines and social cards get consistent, per-object
    control. Left blank, the frontend falls back to sensible defaults (e.g.
    the object's title/excerpt).
    """

    seo_title = models.CharField(
        max_length=70,
        blank=True,
        help_text="Overrides the <title> tag. Keep under ~60 chars.",
    )
    meta_description = models.CharField(
        max_length=160,
        blank=True,
        help_text="The <meta name='description'> snippet. ~150–160 chars.",
    )
    meta_keywords = models.CharField(
        max_length=255,
        blank=True,
        help_text="Comma-separated keywords (low SEO weight today, kept for completeness).",
    )
    canonical_url = models.URLField(
        blank=True,
        help_text="Set when this content also lives at another canonical URL.",
    )
    og_image = models.ImageField(
        upload_to="seo/og/",
        blank=True,
        null=True,
        help_text="Open Graph / Twitter card image (falls back to featured image).",
    )

    class Meta:
        abstract = True
