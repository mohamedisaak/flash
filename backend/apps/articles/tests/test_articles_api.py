"""Tests for the articles API: RBAC, published-only visibility, and actions."""

import pytest
from django.utils import timezone

from apps.articles.models import Article

pytestmark = pytest.mark.django_db


def _make_article(category, author, **extra):
    defaults = {
        "title": "A story",
        "author": author,
        "category": category,
        "status": "draft",
    }
    defaults.update(extra)
    return Article.objects.create(**defaults)


def test_anonymous_cannot_create_article(api, category):
    resp = api.post(
        "/api/v1/articles/",
        {"title": "Hi", "category_id": category.id, "content": "x"},
        format="json",
    )
    assert resp.status_code in (401, 403)


def test_subscriber_cannot_create_article(api, subscriber, category):
    api.force_authenticate(user=subscriber)
    resp = api.post(
        "/api/v1/articles/",
        {"title": "Hi", "category_id": category.id, "content": "x"},
        format="json",
    )
    assert resp.status_code == 403


def test_editor_can_create_article_and_is_author(api, editor, category):
    api.force_authenticate(user=editor)
    resp = api.post(
        "/api/v1/articles/",
        {"title": "Breaking", "category_id": category.id, "content": "body"},
        format="json",
    )
    assert resp.status_code == 201, resp.data
    assert Article.objects.get(title="Breaking").author_id == editor.id


def test_public_list_shows_only_published(api, editor, category):
    _make_article(category, editor, title="Draft one", status="draft")
    _make_article(
        category,
        editor,
        title="Live one",
        status="published",
        published_at=timezone.now(),
    )
    resp = api.get("/api/v1/articles/")
    assert resp.status_code == 200
    titles = [a["title"] for a in resp.data["results"]]
    assert "Live one" in titles
    assert "Draft one" not in titles


def test_staff_list_shows_drafts(api, editor, category):
    _make_article(category, editor, title="Draft one", status="draft")
    api.force_authenticate(user=editor)
    resp = api.get("/api/v1/articles/")
    titles = [a["title"] for a in resp.data["results"]]
    assert "Draft one" in titles


def test_view_action_increments_counter(api, editor, category):
    art = _make_article(category, editor, status="published", published_at=timezone.now())
    assert art.views == 0
    resp = api.post(f"/api/v1/articles/{art.slug}/view/")
    assert resp.status_code == 200
    art.refresh_from_db()
    assert art.views == 1
