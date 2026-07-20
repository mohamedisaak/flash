"""
Advertisement management.

An :class:`Advertisement` is a creative placed in a defined slot (header,
sidebar, in-content, mobile, popup) with an active date window. We track
impressions and clicks as running counters and expose CTR as a derived
property (clicks / impressions) rather than storing it, so it can never drift
out of sync.

See ``teaching/30-database-design/ads-tables.md``.
"""

from django.db import models
from django.utils import timezone

from apps.common.models import TimeStampedModel


class AdPlacement(models.TextChoices):
    HEADER = "header", "Header"
    SIDEBAR = "sidebar", "Sidebar"
    IN_CONTENT = "in_content", "In-content"
    MOBILE = "mobile", "Mobile"
    POPUP = "popup", "Popup"


class Advertisement(TimeStampedModel):
    name = models.CharField(max_length=150)
    placement = models.CharField(
        max_length=16,
        choices=AdPlacement.choices,
        db_index=True,
    )
    image = models.ImageField(upload_to="ads/", blank=True, null=True)
    # For script/HTML-based ad tags (e.g. an ad network snippet).
    html = models.TextField(blank=True, help_text="Raw ad markup, used when no image is set.")
    target_url = models.URLField(blank=True)

    is_active = models.BooleanField(default=True, db_index=True)
    starts_at = models.DateTimeField(default=timezone.now)
    ends_at = models.DateTimeField(null=True, blank=True)

    impressions = models.PositiveBigIntegerField(default=0)
    clicks = models.PositiveBigIntegerField(default=0)

    class Meta:
        ordering = ("-created_at",)
        indexes = [models.Index(fields=["placement", "is_active"])]

    def __str__(self) -> str:
        return f"{self.name} ({self.get_placement_display()})"

    @property
    def ctr(self) -> float:
        """Click-through rate as a fraction (0.0–1.0). Derived, never stored."""
        return (self.clicks / self.impressions) if self.impressions else 0.0
