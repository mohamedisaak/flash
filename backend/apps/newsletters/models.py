"""
Newsletter subscriptions.

A :class:`NewsletterSubscriber` may or may not be a registered user — anonymous
email-only signups are common. The ``token`` is a random unguessable string
used to build one-click unsubscribe links without requiring login.

See ``teaching/30-database-design/newsletter-tables.md``.
"""

import secrets

from django.conf import settings
from django.db import models

from apps.common.models import TimeStampedModel


def _make_token() -> str:
    return secrets.token_urlsafe(32)


class NewsletterSubscriber(TimeStampedModel):
    email = models.EmailField(unique=True)
    # Optional link to an account (null for anonymous signups).
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="newsletter_subscriptions",
    )
    # Which categories they want (empty = the general newsletter).
    categories = models.ManyToManyField(
        "categories.Category",
        blank=True,
        related_name="newsletter_subscribers",
    )
    is_confirmed = models.BooleanField(default=False, help_text="Double opt-in confirmed.")
    is_active = models.BooleanField(default=True)
    token = models.CharField(max_length=64, default=_make_token, unique=True, editable=False)

    class Meta:
        ordering = ("-created_at",)

    def __str__(self) -> str:
        return self.email
