"""Tests for sitemaps, Google News sitemap, robots.txt, RSS, and JSON-LD."""

import pytest
from django.utils import timezone

from apps.articles.models import Article

pytestmark = pytest.mark.django_db


@pytest.fixture
def published_article(editor, category):
    return Article.objects.create(
        title="Big Story", author=editor, category=category,
        excerpt="the standfirst", status="published", published_at=timezone.now(),
    )


def test_sitemap_lists_published_article(client, settings, published_article):
    settings.SITE_URL = "https://news.example.com"
    resp = client.get("/sitemap.xml")
    assert resp.status_code == 200
    body = resp.content.decode()
    # URL uses the SITE_URL (frontend) host, not the API's testserver host.
    assert "https://news.example.com/articles/big-story" in body


def test_news_sitemap_has_news_namespace(client, published_article):
    resp = client.get("/news-sitemap.xml")
    assert resp.status_code == 200
    body = resp.content.decode()
    assert "schemas/sitemap-news" in body
    assert "<news:title>Big Story</news:title>" in body


def test_robots_txt_points_at_sitemaps(client, settings):
    settings.SITE_URL = "https://news.example.com"
    resp = client.get("/robots.txt")
    assert resp.status_code == 200
    body = resp.content.decode()
    assert "Sitemap: https://news.example.com/sitemap.xml" in body
    assert "Disallow: /admin/" in body


def test_rss_feed_renders(client, published_article):
    resp = client.get("/rss/")
    assert resp.status_code == 200
    assert b"Big Story" in resp.content


def test_article_jsonld_endpoint(api, published_article):
    resp = api.get(f"/api/v1/seo/articles/{published_article.slug}/")
    assert resp.status_code == 200
    news = resp.data["newsArticle"]
    assert news["@type"] == "NewsArticle"
    assert news["headline"] == "Big Story"
    assert news["publisher"]["@type"] == "Organization"
    # Breadcrumb has Home > Category > Article.
    assert len(resp.data["breadcrumb"]["itemListElement"]) == 3


def test_organization_jsonld_endpoint(api):
    resp = api.get("/api/v1/seo/organization/")
    assert resp.status_code == 200
    assert resp.data["@type"] == "Organization"
