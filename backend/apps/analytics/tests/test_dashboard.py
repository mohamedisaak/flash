"""Tests for the staff analytics dashboard summary + endpoint."""

from datetime import timedelta

import pytest
from django.utils import timezone
from rest_framework.test import APIClient

from apps.accounts.models import Role, User
from apps.ads.models import Advertisement
from apps.analytics import services
from apps.analytics.models import PageView, SearchQueryLog
from apps.articles.models import Article, ArticleStatus
from apps.categories.models import Category

pytestmark = pytest.mark.django_db


@pytest.fixture
def staff():
    return User.objects.create_user(username="ed", password="x", role=Role.EDITOR_IN_CHIEF)


@pytest.fixture
def seeded(staff):
    cat = Category.objects.create(name="World", slug="world")
    article = Article.objects.create(
        title="Big Story",
        slug="big-story",
        author=staff,
        category=cat,
        status=ArticleStatus.PUBLISHED,
        published_at=timezone.now(),
    )
    # Two visitors read the article; one also lands on the homepage.
    PageView.objects.create(path=f"/articles/{article.slug}", session_key="s1", source="search")
    PageView.objects.create(
        path=f"/articles/{article.slug}", session_key="s2", source="social", read_seconds=60
    )
    PageView.objects.create(path="/", session_key="s1", source="direct")
    SearchQueryLog.objects.create(query="election", results_count=4)
    SearchQueryLog.objects.create(query="election", results_count=4)
    Advertisement.objects.create(name="Banner A", placement="header", impressions=100, clicks=10)
    Advertisement.objects.create(name="Rail B", placement="sidebar", impressions=50, clicks=0)
    return article


def test_summary_totals_and_series(seeded):
    d = services.dashboard_summary(days=30)
    t = d["totals"]
    assert t["pageviews"] == 3
    assert t["visitors"] == 2  # s1, s2 (s1 counted once)
    assert t["avg_read_seconds"] == 20  # (0 + 60 + 0) / 3
    assert t["articles_published"] == 1
    # Ads are lifetime totals.
    assert t["ad_impressions"] == 150 and t["ad_clicks"] == 10
    assert t["ad_ctr"] == round(10 / 150, 4)
    # One row per day in the window, inclusive of today.
    assert len(d["timeseries"]) == 30
    assert d["timeseries"][-1]["pageviews"] == 3


def test_summary_top_articles_and_sources(seeded):
    d = services.dashboard_summary(days=30)
    assert d["top_articles"][0]["title"] == "Big Story"
    assert d["top_articles"][0]["views"] == 2
    sources = {s["source"]: s["count"] for s in d["sources"]}
    assert sources == {"search": 1, "social": 1, "direct": 1}
    assert d["top_searches"][0] == {"query": "election", "count": 2, "avg_results": 4.0}


def test_summary_ads_breakdown(seeded):
    ads = services.dashboard_summary(days=30)["ads"]
    top = ads["by_ad"][0]  # ranked by clicks
    assert top["name"] == "Banner A" and top["ctr"] == 0.1
    placements = {p["placement"]: p for p in ads["by_placement"]}
    assert placements["header"]["clicks"] == 10
    assert placements["sidebar"]["ctr"] == 0.0


def test_window_excludes_old_pageviews(seeded):
    old = PageView.objects.create(path="/old", session_key="s9", source="direct")
    PageView.objects.filter(pk=old.pk).update(created_at=timezone.now() - timedelta(days=40))
    d = services.dashboard_summary(days=7)
    assert d["totals"]["pageviews"] == 3  # the 40-day-old view is excluded


def test_endpoint_requires_staff(seeded):
    anon = APIClient()
    assert anon.get("/api/v1/analytics/dashboard/").status_code in (401, 403)


def test_endpoint_returns_summary_for_staff(staff, seeded):
    client = APIClient()
    client.force_authenticate(staff)
    res = client.get("/api/v1/analytics/dashboard/?days=7")
    assert res.status_code == 200
    assert res.data["range_days"] == 7
    assert res.data["totals"]["visitors"] == 2


# --- Pageview ingest: exclude logged-in staff from visitor counts -----------
def _post_pageview(auth_header: str | None = None):
    client = APIClient()
    kwargs = {"HTTP_AUTHORIZATION": auth_header} if auth_header else {}
    return client.post(
        "/api/v1/analytics/pageview/",
        {"path": "/", "session_key": "v1"},
        format="json",
        **kwargs,
    )


def test_anonymous_pageview_is_recorded():
    assert _post_pageview().status_code == 201
    assert PageView.objects.count() == 1


def test_staff_pageview_is_dropped():
    staff = User.objects.create_user(username="ed2", password="x", role=Role.EDITOR_IN_CHIEF)
    from rest_framework_simplejwt.tokens import AccessToken

    res = _post_pageview(f"Bearer {AccessToken.for_user(staff)}")
    assert res.status_code == 204
    assert PageView.objects.count() == 0  # staff browsing is not a "visitor"


def test_subscriber_pageview_is_recorded():
    sub = User.objects.create_user(username="reader", password="x", role=Role.SUBSCRIBER)
    from rest_framework_simplejwt.tokens import AccessToken

    res = _post_pageview(f"Bearer {AccessToken.for_user(sub)}")
    assert res.status_code == 201  # a logged-in reader still counts
    assert PageView.objects.count() == 1


def test_garbage_token_is_treated_as_anonymous():
    # A stale/invalid token must NOT 401 the beacon — record it as a visitor.
    res = _post_pageview("Bearer not-a-real-token")
    assert res.status_code == 201
    assert PageView.objects.count() == 1
