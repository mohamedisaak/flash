"""
Media library — tracks the derived versions of an uploaded image.

When an editor uploads one photo, we don't serve that giant original to phones on
slow networks. Instead a background task generates several **renditions**:
smaller sizes (thumbnail/small/medium/large) in modern, well-compressed formats
(WebP/AVIF). Each generated file is recorded as an :class:`ImageRendition` row so
the frontend can pick the best one (responsive images).

We key renditions by the **source path** (the original ImageField's stored name)
rather than a hard foreign key, so the same pipeline works for any image field on
any model — article featured images, category art, video thumbnails, etc.

See ``teaching/09-celery/`` and
``teaching/32-performance/`` (image optimization, added later).
"""

from django.db import models

from apps.common.models import TimeStampedModel


class ImageFormat(models.TextChoices):
    WEBP = "webp", "WebP"
    AVIF = "avif", "AVIF"
    JPEG = "jpeg", "JPEG"


class RenditionSize(models.TextChoices):
    THUMBNAIL = "thumbnail", "Thumbnail"
    SMALL = "small", "Small"
    MEDIUM = "medium", "Medium"
    LARGE = "large", "Large"


class ImageRendition(TimeStampedModel):
    """One generated variant of a source image."""

    # The original file's storage name, e.g. "articles/2027/01/photo.jpg".
    source_path = models.CharField(max_length=500, db_index=True)
    size = models.CharField(max_length=16, choices=RenditionSize.choices)
    image_format = models.CharField(max_length=8, choices=ImageFormat.choices)
    file = models.ImageField(upload_to="renditions/%Y/%m/")
    width = models.PositiveIntegerField()
    height = models.PositiveIntegerField()
    bytes = models.PositiveIntegerField(help_text="File size in bytes.")

    class Meta:
        # One rendition per (source, size, format) — regenerating replaces it.
        unique_together = ("source_path", "size", "image_format")
        indexes = [models.Index(fields=["source_path"])]

    def __str__(self) -> str:
        return f"{self.source_path} [{self.size}/{self.image_format}]"
