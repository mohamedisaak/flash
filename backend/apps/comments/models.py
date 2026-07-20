"""
Reader comments with threaded replies and moderation.

Nesting is modelled with a self-referential ``parent`` FK: a reply points at
the comment it answers; top-level comments have ``parent = NULL``. This
"adjacency list" is the simplest way to get threads and is plenty for typical
news comment depths.

Every comment carries a moderation ``status`` (comments are held or auto-
approved per policy) and a lightweight report/spam flag so moderators have a
queue to work.

See ``teaching/30-database-design/comment-tables.md``.
"""

from django.conf import settings
from django.db import models

from apps.common.models import TimeStampedModel


class CommentStatus(models.TextChoices):
    PENDING = "pending", "Pending moderation"
    APPROVED = "approved", "Approved"
    REJECTED = "rejected", "Rejected"
    SPAM = "spam", "Spam"


class Comment(TimeStampedModel):
    article = models.ForeignKey(
        "articles.Article",
        on_delete=models.CASCADE,
        related_name="comments",
    )
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="comments",
    )
    parent = models.ForeignKey(
        "self",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="replies",
        help_text="The comment this one replies to. NULL for top-level comments.",
    )
    body = models.TextField()
    status = models.CharField(
        max_length=12,
        choices=CommentStatus.choices,
        default=CommentStatus.PENDING,
        db_index=True,
    )
    report_count = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ("created_at",)
        indexes = [models.Index(fields=["article", "status"])]

    def __str__(self) -> str:
        return f"Comment {self.pk} on article {self.article_id}"

    @property
    def is_reply(self) -> bool:
        return self.parent_id is not None
