"""
Photo galleries — an ordered set of captioned, credited images.

:class:`PhotoGallery` is the container; :class:`GalleryImage` rows are the
individual photos. This is a classic one-to-many parent/child pair with an
explicit ``order`` column so editors control the sequence.

See ``teaching/30-database-design/gallery-tables.md``.
"""

from django.conf import settings
from django.db import models
from django.utils.text import slugify

from apps.common.models import SEOFields, TimeStampedModel


class PhotoGallery(TimeStampedModel, SEOFields):
    title = models.CharField(max_length=255)
    slug = models.SlugField(max_length=280, unique=True)
    description = models.TextField(blank=True)
    category = models.ForeignKey(
        "categories.Category",
        on_delete=models.PROTECT,
        related_name="galleries",
    )
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="galleries",
    )
    published_at = models.DateTimeField(null=True, blank=True, db_index=True)

    class Meta:
        verbose_name_plural = "photo galleries"
        ordering = ("-published_at", "-created_at")

    def __str__(self) -> str:
        return self.title

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)[:280]
        super().save(*args, **kwargs)


class GalleryImage(TimeStampedModel):
    gallery = models.ForeignKey(
        PhotoGallery,
        on_delete=models.CASCADE,
        related_name="images",
    )
    image = models.ImageField(upload_to="galleries/%Y/%m/")
    caption = models.CharField(max_length=255, blank=True)
    credit = models.CharField(max_length=255, blank=True, help_text="Photographer / agency.")
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ("order", "created_at")
        indexes = [models.Index(fields=["gallery", "order"])]

    def __str__(self) -> str:
        return self.caption or f"Image {self.pk}"
