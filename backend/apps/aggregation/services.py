"""
The aggregation engine: ingest, moderate, and promote.

Three responsibilities:

1. :func:`run_ingestion` — fetch the chosen sources, upsert each story into
   :class:`AggregatedArticle` (de-duplicated on ``source + external_id``), and
   write an :class:`IngestionRun` audit row. One dead feed is recorded, not
   fatal.
2. Moderation helpers — hide/delete by source, delete all.
3. :func:`import_to_article` — turn an aggregated item into a real editorial
   :class:`~apps.articles.models.Article`, as a draft to rewrite or a published
   post. Published posts keep a source *credit* (``Article.source``) but drop the
   outbound link, per the newsroom's choice.

Kept out of the views so it's unit-testable and reusable from a Celery task.

See ``teaching/40-news-aggregation/project-files/services-explained.md``.
"""

from __future__ import annotations

import html
import logging
import os
import re
from urllib.parse import urlparse

from django.core.files.base import ContentFile
from django.db import transaction
from django.utils import timezone
from django.utils.text import slugify

from apps.articles.models import Article, ArticleStatus
from apps.categories.models import Category

from . import sources as source_registry
from .extract import extract_article
from .fetchers import FetchError, _http_get, fetch
from .models import AggregatedArticle, IngestionRun

logger = logging.getLogger(__name__)

# The category an import falls back to when the admin doesn't pick one. The
# category is now chosen per-import in the admin UI rather than derived from the
# source's region, so nothing is auto-tagged "Kenya".
_DEFAULT_CATEGORY = ("world", "World")


# ---------------------------------------------------------------------------
# Ingestion
# ---------------------------------------------------------------------------
def _upsert(source, item, dry_run: bool, category: str = "") -> str:
    """Insert or update one item. Returns 'created' | 'updated'.

    ``category`` tags the item with the editorial section it was crawled for
    (empty for whole-site feeds). We only *set* a category, never clear one, so a
    later whole-site pass doesn't wipe the section off an item already crawled by
    category.
    """
    exists = AggregatedArticle.objects.filter(
        source=source.slug, external_id=item.external_id
    ).exists()
    if dry_run:
        return "updated" if exists else "created"

    defaults = {
        "source_name": source.name,
        "region": source.region,
        "url": item.url,
        "title": item.title,
        "summary": item.summary,
        "author": item.author,
        "image_url": item.image_url,
        "published_at": item.published_at,
    }
    if category:
        defaults["category"] = category
    _, created = AggregatedArticle.objects.update_or_create(
        source=source.slug,
        external_id=item.external_id,
        defaults=defaults,
    )
    return "created" if created else "updated"


def _crawl(source, max_items: int, dry_run: bool, totals: dict, category: str = "") -> dict:
    """Fetch one feed and upsert its items, returning a per-feed result entry.

    Shared by whole-site and category-scoped ingestion. One dead feed is
    recorded in its entry and never aborts the run.
    """
    entry = {"created": 0, "updated": 0, "skipped": 0, "error": 0, "message": ""}
    if not source.is_available:
        entry["message"] = "No API key configured — skipped."
        return entry
    try:
        items = fetch(source, max_items)
    except FetchError as exc:
        entry["error"] = 1
        totals["error"] += 1
        entry["message"] = str(exc)[:300]
        logger.warning("Ingestion: %s failed: %s", source.slug, exc)
        return entry
    for item in items:
        try:
            result = _upsert(source, item, dry_run, category=category)
            entry[result] += 1
            totals[result] += 1
        except Exception:  # noqa: BLE001 — never let one bad row abort the run
            entry["error"] += 1
            totals["error"] += 1
            logger.exception("Ingestion: failed to store item from %s", source.slug)
    return entry


def run_ingestion(
    slugs=None, categories=None, max_items: int = 25, dry_run: bool = False, user=None
) -> dict:
    """Ingest the chosen sources and return a serialisable run summary.

    ``categories`` opts into category-scoped crawling: for each chosen Kenyan
    source that supports it, pull the selected sections (Sports, Business, …)
    instead of the whole site, tagging every item with its section. When
    ``categories`` is empty, behaves as before (whole-site feeds).
    """
    chosen = source_registry.resolve(slugs)
    cats = [c for c in (categories or []) if c in source_registry.CATEGORY_BY_SLUG]
    detail: dict[str, dict] = {}
    totals = {"created": 0, "updated": 0, "skipped": 0, "error": 0}

    if cats:
        crawlable = {s.slug for s in source_registry.category_crawl_sources()}
        for base in chosen:
            if base.slug not in crawlable:
                continue  # non-Kenyan / API sources aren't category-crawled
            for cat_slug in cats:
                syn = source_registry.category_feed_source(base.slug, cat_slug)
                if syn is None:
                    continue
                detail[f"{base.slug} · {cat_slug}"] = _crawl(
                    syn, max_items, dry_run, totals, category=cat_slug
                )
    else:
        for source in chosen:
            detail[source.slug] = _crawl(source, max_items, dry_run, totals)

    run = IngestionRun.objects.create(
        sources=[s.slug for s in chosen],
        dry_run=dry_run,
        created_count=totals["created"],
        updated_count=totals["updated"],
        skipped_count=totals["skipped"],
        error_count=totals["error"],
        detail=detail,
        message=("Dry run — no data written." if dry_run else ""),
        triggered_by=user if getattr(user, "is_authenticated", False) else None,
    )
    return {
        "run_id": run.id,
        "dry_run": dry_run,
        "sources": [s.slug for s in chosen],
        "categories": cats,
        **totals,
        "detail": detail,
    }


# ---------------------------------------------------------------------------
# Moderation
# ---------------------------------------------------------------------------
def hide_source(slug: str, hidden: bool = True) -> int:
    return AggregatedArticle.objects.filter(source=slug).update(is_hidden=hidden)


def delete_source(slug: str) -> int:
    deleted, _ = AggregatedArticle.objects.filter(source=slug).delete()
    return deleted


def delete_all() -> int:
    deleted, _ = AggregatedArticle.objects.all().delete()
    return deleted


# ---------------------------------------------------------------------------
# Full-content extraction (on demand — fetches the article page)
# ---------------------------------------------------------------------------
def _extract(agg: AggregatedArticle) -> tuple[str, str]:
    """Extract (body, image), skipping sources known to be membership-gated."""
    src = source_registry.get(agg.source)
    if src and src.paywalled:
        return "", ""
    return extract_article(agg.url)


def fetch_full_content(agg: AggregatedArticle) -> bool:
    """Extract and cache the full body (and lead image) for one item."""
    body, image = _extract(agg)
    agg.content = body
    agg.content_fetched = True
    fields = ["content", "content_fetched", "updated_at"]
    if image and not agg.image_url:  # backfill an image the feed didn't provide
        agg.image_url = image[:1000]
        fields.append("image_url")
    agg.save(update_fields=fields)
    return bool(body)


def bulk_fetch_content(ids) -> dict:
    fetched, empty = 0, 0
    for agg in AggregatedArticle.objects.filter(id__in=ids):
        if fetch_full_content(agg):
            fetched += 1
        else:
            empty += 1
    return {"fetched": fetched, "empty": empty}


# ---------------------------------------------------------------------------
# Promotion to editorial Article
# ---------------------------------------------------------------------------
def _unique_slug(title: str) -> str:
    base = slugify(title)[:250] or "story"
    slug = base
    i = 2
    while Article.objects.filter(slug=slug).exists():
        slug = f"{base}-{i}"[:280]
        i += 1
    return slug


def _resolve_category(slug: str | None) -> Category:
    """Return the Category with ``slug`` (creating it if new), or the default.

    The admin chooses the category at import time. An unknown slug is created
    with a humanised name so a brand-new section like "world" just works.
    """
    slug = (slug or "").strip()
    if not slug:
        slug, name = _DEFAULT_CATEGORY
    else:
        name = slug.replace("-", " ").title()
    category, _ = Category.objects.get_or_create(slug=slug, defaults={"name": name})
    return category


def _download_image(article: Article, image_url: str) -> None:
    """Best-effort: pull the remote lead image into the Article's ImageField."""
    if not image_url:
        return
    try:
        data = _http_get(image_url)
    except FetchError:
        return
    if not data:
        return
    ext = os.path.splitext(urlparse(image_url).path)[1].lower()
    if ext not in {".jpg", ".jpeg", ".png", ".webp", ".gif"}:
        ext = ".jpg"
    article.featured_image.save(f"{article.slug}{ext}", ContentFile(data), save=True)


@transaction.atomic
def import_to_article(
    agg: AggregatedArticle,
    user,
    publish: bool = False,
    extract: bool = True,
    category_slug: str | None = None,
) -> Article:
    """Create (or return the existing) editorial Article for an aggregated item.

    Uses the full article body when available: the cached extraction if present,
    otherwise (when ``extract``) a fresh extraction from the source URL, falling
    back to the feed summary for paywalled/gated pages. ``publish=True`` produces
    a live post with a source credit but no outbound link; otherwise a draft.
    ``category_slug`` is the editorial section chosen by the admin; when omitted
    the item lands in the default section (never auto-tagged by region).
    """
    if agg.imported_article_id:
        return agg.imported_article

    summary = agg.summary or agg.title
    body = agg.content
    if not body and extract and not agg.content_fetched:
        body, image = _extract(agg)
        # Cache the extraction (and the fact we tried) back on the aggregated row.
        agg.content = body
        agg.content_fetched = True
        if image and not agg.image_url:  # backfill a missing lead image
            agg.image_url = image[:1000]

    content_html = body or f"<p>{html.escape(summary)}</p>"
    words = len(re.sub(r"<[^>]+>", " ", content_html).split())

    article = Article(
        title=agg.title[:255],
        slug=_unique_slug(agg.title),
        excerpt=summary[:500],
        content=content_html,
        author=user,
        # Explicit choice wins; otherwise auto-file into the section this item
        # was crawled for (e.g. "sports"); else the default section.
        category=_resolve_category(category_slug or agg.category),
        source=agg.source_name,  # credit only — the outbound link is intentionally dropped
        status=ArticleStatus.PUBLISHED if publish else ArticleStatus.DRAFT,
        published_at=timezone.now() if publish else None,
        reading_time=max(1, words // 200),
    )
    article.save()
    _download_image(article, agg.image_url)

    agg.imported_article = article
    agg.imported_at = timezone.now()
    agg.save(
        update_fields=[
            "content",
            "content_fetched",
            "image_url",
            "imported_article",
            "imported_at",
            "updated_at",
        ]
    )
    return article


def bulk_import(ids, user, publish: bool = False, category_slug: str | None = None) -> dict:
    """Import many aggregated items into ``category_slug``. Skips imported rows."""
    qs = AggregatedArticle.objects.filter(id__in=ids)
    imported, skipped = 0, 0
    for agg in qs:
        if agg.imported_article_id:
            skipped += 1
            continue
        import_to_article(agg, user, publish=publish, category_slug=category_slug)
        imported += 1
    return {"imported": imported, "skipped": skipped, "published": publish}
