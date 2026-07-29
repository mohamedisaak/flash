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

from apps.common.images import optimize_uploaded_image
from apps.common.models import TimeStampedModel


class AdPlacement(models.TextChoices):
    HEADER = "header", "Header"
    SIDEBAR = "sidebar", "Sidebar"
    IN_CONTENT = "in_content", "In-content"
    MOBILE = "mobile", "Mobile"
    POPUP = "popup", "Popup"


class OverlayPosition(models.TextChoices):
    TOP = "top", "Top"
    CENTER = "center", "Center"
    BOTTOM = "bottom", "Bottom"


class AdEffect(models.TextChoices):
    NONE = "none", "None"
    PULSE = "pulse", "Pulse (gentle)"
    GLOW = "glow", "Glow"
    BLINK = "blink", "Blink"


class ImageFit(models.TextChoices):
    # `contain` shows the whole image (may letterbox); `cover` fills the slot,
    # cropping top/bottom or sides. Use cover when the subject is centred and
    # edge-cropping is acceptable, contain when the full image must be visible.
    CONTAIN = "contain", "Contain (whole image)"
    COVER = "cover", "Cover (fill, may crop)"


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

    # --- Attention-grabbing options (optional) ---
    # For header / in-content banners: text shown beside the centered image,
    # filling the empty space on either side.
    left_text = models.CharField(
        max_length=120,
        blank=True,
        help_text="Text to the left of a header/in-content banner image.",
    )
    right_text = models.CharField(
        max_length=120,
        blank=True,
        help_text="Text to the right of a header/in-content banner image.",
    )
    overlay_text = models.CharField(
        max_length=120,
        blank=True,
        help_text="Optional words shown on top of the image (other placements).",
    )
    overlay_position = models.CharField(
        max_length=8, choices=OverlayPosition.choices, default=OverlayPosition.BOTTOM
    )
    image_fit = models.CharField(
        max_length=8,
        choices=ImageFit.choices,
        default=ImageFit.CONTAIN,
        help_text="How the image fills its slot: contain (whole image) or cover (fill, may crop).",
    )
    effect = models.CharField(
        max_length=8,
        choices=AdEffect.choices,
        default=AdEffect.NONE,
        help_text="High-visibility animation for the ad.",
    )

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

    def save(self, *args, **kwargs):
        # Tidy a freshly uploaded creative: fix orientation, cap size, optimise.
        optimize_uploaded_image(self.image, max_size=(1600, 1600))
        super().save(*args, **kwargs)

    @property
    def ctr(self) -> float:
        """Click-through rate as a fraction (0.0–1.0). Derived, never stored."""
        return (self.clicks / self.impressions) if self.impressions else 0.0
