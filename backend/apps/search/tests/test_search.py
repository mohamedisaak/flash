"""Tests for the search + autocomplete endpoints (SQLite fallback path)."""

import pytest
from django.utils import timezone

from apps.analytics.models import SearchQueryLog
from apps.articles.models import Article

pytestmark = pytest.mark.django_db


@pytest.fixture
def articles(editor, category):
    def make(title, status="published", **extra):
        return Article.objects.create(
            title=title, author=editor, category=category,
            status=status, published_at=timezone.now(), **extra,
        )

    return {
        "election": make("Kenya election results", excerpt="vote tally"),
        "weather": make("Weather forecast today", excerpt="rain expected"),
        "draft": make("Election draft", status="draft"),
    }


def test_search_finds_matching_published_articles(api, articles):
    resp = api.get("/api/v1/search/?q=election")
    assert resp.status_code == 200
    titles = [a["title"] for a in resp.data["results"]]
    assert "Kenya election results" in titles
    assert "Weather forecast today" not in titles
    # A draft must never surface, even if it matches.
    assert "Election draft" not in titles


def test_search_logs_the_query(api, articles):
    api.get("/api/v1/search/?q=election")
    log = SearchQueryLog.objects.get(query="election")
    assert log.results_count == 1


def test_empty_query_returns_no_results_and_no_log(api, articles):
    resp = api.get("/api/v1/search/?q=")
    assert resp.status_code == 200
    assert resp.data["results"] == []
    assert not SearchQueryLog.objects.exists()


def test_autocomplete_suggests_titles(api, articles):
    resp = api.get("/api/v1/search/autocomplete/?q=weather")
    assert resp.status_code == 200
    assert "Weather forecast today" in resp.data["suggestions"]


def test_opensearch_backend_selected_by_flag(settings):
    settings.SEARCH_BACKEND = "opensearch"
    from apps.search.backends import OpenSearchBackend, get_search_backend

    assert isinstance(get_search_backend(), OpenSearchBackend)
