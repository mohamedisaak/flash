"""
Notifications — one row per message sent to (or queued for) a user.

The same table backs three delivery channels (push via FCM, in-app, email),
distinguished by ``channel``. ``payload`` is a flexible JSON blob for
channel-specific data (deep-link route, image, etc.). Delivery itself happens
in a later phase via Celery; here we model the record and its read/sent state.

See ``teaching/30-database-design/notification-tables.md``.
"""

from django.conf import settings
from django.db import models

from apps.common.models import TimeStampedModel


class NotificationChannel(models.TextChoices):
    PUSH = "push", "Push"
    IN_APP = "in_app", "In-app"
    EMAIL = "email", "Email"


class NotificationType(models.TextChoices):
    BREAKING = "breaking", "Breaking news"
    CATEGORY = "category", "Category alert"
    TOPIC = "topic", "Personalized topic"
    SYSTEM = "system", "System"


class Notification(TimeStampedModel):
    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications",
    )
    channel = models.CharField(max_length=12, choices=NotificationChannel.choices, db_index=True)
    type = models.CharField(
        max_length=12, choices=NotificationType.choices, default=NotificationType.SYSTEM
    )

    title = models.CharField(max_length=255)
    body = models.TextField(blank=True)
    payload = models.JSONField(default=dict, blank=True)

    is_read = models.BooleanField(default=False, db_index=True)
    sent_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ("-created_at",)
        indexes = [
            models.Index(fields=["recipient", "is_read"]),
            # The list endpoint is always scoped to the recipient and ordered
            # newest-first; this composite serves that scan + sort directly.
            models.Index(fields=["recipient", "-created_at"]),
        ]

    def __str__(self) -> str:
        return f"{self.title} -> {self.recipient_id}"
