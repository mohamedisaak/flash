"""
Live coverage — real-time blogs for elections, sports, emergencies.

A :class:`LiveBlog` is a container for a running event; :class:`LiveBlogUpdate`
rows are the individual timestamped posts that stream in newest-first. The
frontend polls (or, later, subscribes over WebSockets) for new updates so
readers see them appear live.

See ``teaching/29-system-design/`` (real-time delivery) and
``teaching/30-database-design/livecoverage-tables.md``.
"""

from django.conf import settings
from django.db import models
from django.utils.text import slugify

from apps.common.models import SEOFields, TimeStampedModel


class LiveBlogStatus(models.TextChoices):
    UPCOMING = "upcoming", "Upcoming"
    LIVE = "live", "Live"
    ENDED = "ended", "Ended"


class LiveBlog(TimeStampedModel, SEOFields):
    title = models.CharField(max_length=255)
    slug = models.SlugField(max_length=280, unique=True)
    summary = models.TextField(blank=True)
    category = models.ForeignKey(
        "categories.Category",
        on_delete=models.PROTECT,
        related_name="live_blogs",
    )
    status = models.CharField(
        max_length=16,
        choices=LiveBlogStatus.choices,
        default=LiveBlogStatus.UPCOMING,
        db_index=True,
    )
    starts_at = models.DateTimeField(null=True, blank=True)
    ended_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ("-starts_at", "-created_at")

    def __str__(self) -> str:
        return self.title

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)[:280]
        super().save(*args, **kwargs)


class LiveBlogUpdate(TimeStampedModel):
    """One post in a live blog's timeline."""

    live_blog = models.ForeignKey(
        LiveBlog,
        on_delete=models.CASCADE,
        related_name="updates",
    )
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="live_updates",
    )
    headline = models.CharField(max_length=255, blank=True)
    body = models.TextField()
    is_pinned = models.BooleanField(default=False, help_text="Keep at top (e.g. key result).")

    class Meta:
        ordering = ("-is_pinned", "-created_at")
        indexes = [models.Index(fields=["live_blog", "-created_at"])]

    def __str__(self) -> str:
        return self.headline or f"Update {self.pk}"
