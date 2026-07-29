"""
Scheduled/background tasks for articles.

``publish_scheduled_articles`` is the engine behind the "Scheduled" status: an
editor sets ``status=scheduled`` with a future ``published_at``; this task —
run every minute by Celery beat — flips such articles to "Published" once their
time arrives. See ``teaching/09-celery/05-periodic-tasks.md``.
"""

import logging

from celery import shared_task
from django.utils import timezone

from .models import Article, ArticleStatus

logger = logging.getLogger(__name__)


@shared_task
def publish_scheduled_articles() -> int:
    """Publish any scheduled article whose time has come. Returns the count."""
    now = timezone.now()
    count = Article.objects.filter(status=ArticleStatus.SCHEDULED, published_at__lte=now).update(
        status=ArticleStatus.PUBLISHED
    )
    if count:
        logger.info("publish_scheduled_articles: published %d article(s)", count)
    return count
