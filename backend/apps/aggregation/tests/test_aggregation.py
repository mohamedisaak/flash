"""
Tests for the news-aggregation app.

Network is mocked everywhere (``fetchers.fetch`` is patched) so tests are fast,
deterministic, and offline — we test our pipeline, not the live feeds.
"""

import pytest
from django.utils import timezone
from rest_framework.test import APIClient

from apps.accounts.models import Role, User
from apps.aggregation import services
from apps.aggregation.fetchers import FeedItem
from apps.aggregation.models import AggregatedArticle, IngestionRun
from apps.articles.models import Article, ArticleStatus
from apps.categories.models import Category


def _items(n=3, source="bbc"):
    return [
        FeedItem(
            external_id=f"{source}-{i}",
            url=f"https://example.com/{source}/{i}",
            title=f"{source} story {i}",
            summary="A short summary of the story.",
            author="Reporter",
            image_url="",
            published_at=timezone.now(),
        )
        for i in range(n)
    ]


@pytest.fixture
def staff(db):
    return User.objects.create_user(username="ed", password="x", role=Role.EDITOR_IN_CHIEF)


@pytest.fixture
def api(staff):
    c = APIClient()
    c.force_authenticate(staff)
    return c


@pytest.fixture(autouse=True)
def _mock_network(monkeypatch):
    """Mock every network call: feeds pull fake items, extraction returns body+image."""
    monkeypatch.setattr(services, "fetch", lambda source, max_items: _items(3, source.slug))
    monkeypatch.setattr(
        services,
        "extract_article",
        lambda url: ("<p>The full extracted article body.</p>", "https://img.example/lead.jpg"),
    )
    # Don't hit the network when a test import downloads the (mocked) lead image.
    monkeypatch.setattr(services, "_download_image", lambda article, image_url: None)


@pytest.mark.django_db
def test_run_ingestion_creates_and_dedups():
    first = services.run_ingestion(slugs=["bbc"], max_items=10)
    assert first["created"] == 3
    assert AggregatedArticle.objects.count() == 3

    # Re-running the same source updates, never duplicates (unique constraint).
    second = services.run_ingestion(slugs=["bbc"], max_items=10)
    assert second["updated"] == 3 and second["created"] == 0
    assert AggregatedArticle.objects.count() == 3


@pytest.mark.django_db
def test_dry_run_writes_nothing_but_records_run():
    services.run_ingestion(slugs=["bbc"], max_items=10, dry_run=True)
    assert AggregatedArticle.objects.count() == 0
    assert IngestionRun.objects.filter(dry_run=True).count() == 1


@pytest.mark.django_db
def test_import_publishes_with_source_credit(staff):
    services.run_ingestion(slugs=["nation"], max_items=10)
    agg = AggregatedArticle.objects.first()

    article = services.import_to_article(agg, staff, publish=True)
    assert article.status == ArticleStatus.PUBLISHED
    assert article.published_at is not None
    assert article.source == agg.source_name  # credit kept
    assert agg.url not in article.content  # outbound link dropped

    agg.refresh_from_db()
    assert agg.imported_article_id == article.id
    # Idempotent: importing again returns the same article.
    assert services.import_to_article(agg, staff, publish=True).id == article.id


@pytest.mark.django_db
def test_import_draft_does_not_publish(staff):
    services.run_ingestion(slugs=["bbc"], max_items=10)
    agg = AggregatedArticle.objects.first()
    article = services.import_to_article(agg, staff, publish=False)
    assert article.status == ArticleStatus.DRAFT
    assert article.published_at is None


@pytest.mark.django_db
def test_import_uses_chosen_category_not_region(staff):
    # A Kenyan source is no longer auto-tagged "kenya": with no category chosen
    # it lands in the default "world" section, and an explicit choice is honoured.
    services.run_ingestion(slugs=["nation"], max_items=10)
    agg1, agg2 = AggregatedArticle.objects.all()[:2]

    default = services.import_to_article(agg1, staff)
    assert default.category.slug == "world"
    assert not Category.objects.filter(slug="kenya").exists()

    chosen = services.import_to_article(agg2, staff, category_slug="politics")
    assert chosen.category.slug == "politics"  # created on demand
    assert chosen.category.name == "Politics"


@pytest.mark.django_db
def test_import_uses_extracted_full_body(staff):
    services.run_ingestion(slugs=["bbc"], max_items=10)  # bbc is not paywalled
    agg = AggregatedArticle.objects.first()
    article = services.import_to_article(agg, staff, publish=True)
    assert "full extracted article body" in article.content
    agg.refresh_from_db()
    assert agg.content_fetched and agg.content  # cached back on the row
    assert agg.image_url == "https://img.example/lead.jpg"  # lead image backfilled from the page


@pytest.mark.django_db
def test_paywalled_source_falls_back_to_summary(staff, monkeypatch):
    from apps.aggregation import sources as sreg

    services.run_ingestion(slugs=["bbc"], max_items=10)
    agg = AggregatedArticle.objects.first()
    # Flag this item's source as paywalled → extraction is skipped entirely.
    gated = sreg.Source(
        "bbc", "BBC", sreg.SourceKind.RSS, sreg.SourceRegion.INTERNATIONAL, paywalled=True
    )
    monkeypatch.setattr(services.source_registry, "get", lambda slug: gated)

    assert services.fetch_full_content(agg) is False  # extraction skipped
    article = services.import_to_article(agg, staff, publish=True)
    assert "full extracted article body" not in article.content
    assert agg.summary[:20] in article.content  # used the feed summary instead


@pytest.mark.django_db
def test_bulk_fetch_content(staff):
    services.run_ingestion(slugs=["bbc"], max_items=10)
    ids = list(AggregatedArticle.objects.values_list("id", flat=True))
    result = services.bulk_fetch_content(ids)
    assert result["fetched"] == 3 and result["empty"] == 0
    assert AggregatedArticle.objects.filter(content_fetched=True).count() == 3


@pytest.mark.django_db
def test_hide_and_delete_by_source():
    services.run_ingestion(slugs=["bbc", "cnn"], max_items=10)
    assert services.hide_source("bbc") == 3
    assert AggregatedArticle.objects.filter(source="bbc", is_hidden=True).count() == 3
    assert services.delete_source("cnn") >= 3
    assert AggregatedArticle.objects.filter(source="cnn").count() == 0


@pytest.mark.django_db
def test_endpoints_require_staff():
    anon = APIClient()
    assert anon.get("/api/v1/aggregation/items/").status_code in (401, 403)


@pytest.mark.django_db
def test_run_and_bulk_via_api(api):
    r = api.post(
        "/api/v1/aggregation/items/run/", {"sources": ["bbc"], "max_items": 5}, format="json"
    )
    assert r.status_code == 200 and r.data["created"] == 3

    ids = list(AggregatedArticle.objects.values_list("id", flat=True))
    r = api.post(
        "/api/v1/aggregation/items/bulk/", {"action": "publish", "ids": ids}, format="json"
    )
    assert r.status_code == 200 and r.data["imported"] == 3
    assert Article.objects.filter(status=ArticleStatus.PUBLISHED).count() == 3


def test_fetch_sitemap_parses_news_entries(monkeypatch):
    from apps.aggregation import fetchers
    from apps.aggregation.sources import get

    xml = (
        b"<urlset>"
        b"<url><loc>https://x.co/a</loc><news:title>Title A</news:title>"
        b"<news:publication_date>2026-07-21T20:50:46+03:00</news:publication_date>"
        b"<image:loc>https://x.co/a.jpg</image:loc></url>"
        b"<url><loc>https://x.co/b</loc><news:title><![CDATA[Title B]]></news:title></url>"
        b"</urlset>"
    )
    monkeypatch.setattr(fetchers, "_http_get", lambda *a, **k: xml)
    items = fetchers.fetch_sitemap(get("citizen"), 10)
    assert len(items) == 2
    assert items[0].url == "https://x.co/a" and items[0].title == "Title A"
    assert items[0].image_url == "https://x.co/a.jpg" and items[0].published_at is not None
    assert items[1].title == "Title B"


def test_google_news_url_decoding(monkeypatch):
    from apps.aggregation import google_news

    page = b'<div data-n-a-sg="SIG" data-n-a-ts="123" data-n-a-id="AID"></div>'
    batch = b'[["wrb.fr","Fbv4je","[\\"https://real.example/story\\"]"]]'
    seq = iter([page, batch])
    monkeypatch.setattr(google_news, "_http_get", lambda *a, **k: next(seq))

    assert google_news.is_google_news_url("https://news.google.com/rss/articles/CBMiABC?oc=5")
    assert (
        google_news.decode_url("https://news.google.com/rss/articles/CBMiABC?oc=5")
        == "https://real.example/story"
    )


@pytest.mark.django_db
def test_sources_endpoint_reports_availability(api):
    r = api.get("/api/v1/aggregation/items/sources/")
    assert r.status_code == 200
    by_slug = {s["slug"]: s for s in r.data}
    assert by_slug["bbc"]["available"] is True  # RSS always available
    assert by_slug["newsapi"]["available"] is False  # no key in test env
    assert by_slug["newsapi"]["requires_key"] is True


@pytest.mark.django_db
def test_category_crawl_tags_items_and_autofiles(staff):
    """Category-scoped crawl tags items, and import auto-files into that section."""
    summary = services.run_ingestion(slugs=["standard"], categories=["sports"], max_items=5)
    assert summary["categories"] == ["sports"]
    assert summary["created"] == 3

    aggs = AggregatedArticle.objects.all()
    assert aggs.count() == 3
    assert all(a.category == "sports" and a.source == "standard" for a in aggs)

    # Import with no explicit category → files into the crawled "sports" section.
    article = services.import_to_article(aggs.first(), staff)
    assert article.category.slug == "sports"


@pytest.mark.django_db
def test_category_crawl_skips_non_kenyan_sources():
    """Only Kenyan sources are category-crawled; BBC (international) is skipped."""
    summary = services.run_ingestion(slugs=["bbc"], categories=["sports"], max_items=5)
    assert summary["created"] == 0
    assert AggregatedArticle.objects.count() == 0


@pytest.mark.django_db
def test_categories_endpoint(api):
    r = api.get("/api/v1/aggregation/items/categories/")
    assert r.status_code == 200
    slugs = {c["slug"] for c in r.data}
    assert {"sports", "business", "politics"} <= slugs
