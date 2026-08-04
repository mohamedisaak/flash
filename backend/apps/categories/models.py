"""
Taxonomy: how articles are organised for readers and search engines.

- :class:`Category` is the primary, hierarchical section (Politics > Elections).
  Each maps to a URL like ``/politics/`` and carries its own SEO metadata.
- :class:`Tag` is a flat, unlimited free-form label (e.g. "world-cup-2026").

A category is a *one-to-many* parent of articles; a tag is *many-to-many* with
articles. See ``teaching/30-database-design/`` for what those relationships mean.
"""

import re

from django.db import models
from django.utils.text import slugify

from apps.common.models import SEOFields, TimeStampedModel

# A leading number in a category name, e.g. "047 Nairobi" → 47. Used to order
# numbered lists (the 47 counties) by that number rather than alphabetically.
_LEADING_NUMBER = re.compile(r"^\s*(\d+)")


def leading_number(name: str) -> int | None:
    """Return the integer a name starts with, or None. '047 Nairobi' → 47."""
    match = _LEADING_NUMBER.match(name or "")
    return int(match.group(1)) if match else None


class Category(TimeStampedModel, SEOFields):
    """A top-level or nested news section.

    ``parent`` is a self-referential FK: a category can have a parent category,
    which lets us build Politics > Elections without a separate table. The
    ``slug`` is the URL-safe identifier used in the address bar.
    """

    name = models.CharField(max_length=80)
    slug = models.SlugField(max_length=90, unique=True, help_text="URL segment, e.g. 'politics'.")
    description = models.TextField(blank=True)
    featured_image = models.ImageField(upload_to="categories/", blank=True, null=True)

    parent = models.ForeignKey(
        "self",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="children",
        help_text="Optional parent section for nesting.",
    )
    # Editors curate ordering on nav bars / section pages.
    order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name_plural = "categories"
        ordering = ("order", "name")
        indexes = [models.Index(fields=["parent", "order"])]

    def __str__(self) -> str:
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        # If no explicit order was set, derive it from a leading number in the
        # name ("047 Nairobi" → 47), so numbered lists such as the counties sort
        # by that number in the nav and admin. Editors who set an order keep it.
        if not self.order:
            number = leading_number(self.name)
            if number is not None:
                self.order = number
        super().save(*args, **kwargs)


class Tag(TimeStampedModel):
    """A lightweight, unlimited free-form label attached to content."""

    name = models.CharField(max_length=50, unique=True)
    slug = models.SlugField(max_length=60, unique=True)

    class Meta:
        ordering = ("name",)

    def __str__(self) -> str:
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)
