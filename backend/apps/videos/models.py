"""
Video news items.

The uploaded file is later processed by an FFmpeg Celery pipeline (Phase 3) to
generate a thumbnail, compress, and produce HLS renditions. Here in Phase 1 we
only model the data. ``duration_seconds`` and ``hls_playlist`` are populated by
that pipeline; they start empty on upload.

See ``teaching/30-database-design/video-tables.md``.
"""

from django.conf import settings
from django.db import models
from django.utils.text import slugify

from apps.common.models import SEOFields, TimeStampedModel


class Video(TimeStampedModel, SEOFields):
    title = models.CharField(max_length=255)
    slug = models.SlugField(max_length=280, unique=True)
    description = models.TextField(blank=True)

    thumbnail = models.ImageField(upload_to="videos/thumbs/%Y/%m/", blank=True, null=True)
    video_file = models.FileField(upload_to="videos/source/%Y/%m/")
    # Filled in by the processing pipeline in a later phase.
    hls_playlist = models.CharField(max_length=500, blank=True, help_text="Path/URL to .m3u8 master playlist.")
    duration_seconds = models.PositiveIntegerField(default=0)

    category = models.ForeignKey(
        "categories.Category",
        on_delete=models.PROTECT,
        related_name="videos",
    )
    tags = models.ManyToManyField("categories.Tag", blank=True, related_name="videos")
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="videos",
    )

    published_at = models.DateTimeField(null=True, blank=True, db_index=True)
    views = models.PositiveBigIntegerField(default=0)

    class Meta:
        ordering = ("-published_at", "-created_at")

    def __str__(self) -> str:
        return self.title

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)[:280]
        super().save(*args, **kwargs)
