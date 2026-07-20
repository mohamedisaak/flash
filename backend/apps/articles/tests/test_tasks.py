"""Tests for the scheduled-publish beat task."""

from datetime import timedelta

import pytest
from django.utils import timezone

from apps.articles.models import Article, ArticleStatus
from apps.articles.tasks import publish_scheduled_articles

pytestmark = pytest.mark.django_db


def _scheduled(category, author, when):
    return Article.objects.create(
        title=f"Scheduled {when}", author=author, category=category,
        status=ArticleStatus.SCHEDULED, published_at=when,
    )


def test_due_articles_go_live(editor, category):
    past = timezone.now() - timedelta(minutes=5)
    future = timezone.now() + timedelta(hours=1)
    due = _scheduled(category, editor, past)
    not_due = _scheduled(category, editor, future)

    published = publish_scheduled_articles()

    assert published == 1
    due.refresh_from_db()
    not_due.refresh_from_db()
    assert due.status == ArticleStatus.PUBLISHED
    assert not_due.status == ArticleStatus.SCHEDULED


def test_no_due_articles_returns_zero(editor, category):
    _scheduled(category, editor, timezone.now() + timedelta(days=1))
    assert publish_scheduled_articles() == 0
