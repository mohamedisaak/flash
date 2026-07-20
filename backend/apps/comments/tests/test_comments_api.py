"""Tests for the comments API: moderation visibility and ownership."""

import pytest
from django.utils import timezone

from apps.articles.models import Article
from apps.comments.models import Comment

pytestmark = pytest.mark.django_db


@pytest.fixture
def article(category, editor):
    return Article.objects.create(
        title="Story", author=editor, category=category,
        status="published", published_at=timezone.now(),
    )


def test_new_comment_is_pending(api, subscriber, article):
    api.force_authenticate(user=subscriber)
    resp = api.post(
        "/api/v1/comments/",
        {"article": article.id, "body": "First!"},
        format="json",
    )
    assert resp.status_code == 201
    assert Comment.objects.get(body="First!").status == "pending"


def test_public_sees_only_approved_comments(api, subscriber, article):
    Comment.objects.create(article=article, author=subscriber, body="approved", status="approved")
    Comment.objects.create(article=article, author=subscriber, body="pending", status="pending")
    resp = api.get(f"/api/v1/comments/?article={article.id}")
    bodies = [c["body"] for c in resp.data["results"]]
    assert "approved" in bodies
    assert "pending" not in bodies


def test_moderator_sees_pending_comments(api, editor, subscriber, article):
    Comment.objects.create(article=article, author=subscriber, body="pending", status="pending")
    api.force_authenticate(user=editor)
    resp = api.get(f"/api/v1/comments/?article={article.id}")
    bodies = [c["body"] for c in resp.data["results"]]
    assert "pending" in bodies


def test_anonymous_cannot_comment(api, article):
    resp = api.post(
        "/api/v1/comments/", {"article": article.id, "body": "hi"}, format="json"
    )
    assert resp.status_code in (401, 403)
