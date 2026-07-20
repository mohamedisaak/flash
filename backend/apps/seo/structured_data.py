"""
Schema.org structured data (JSON-LD) builders.

Structured data is a small JSON block that describes a page's content in a
vocabulary search engines understand (schema.org). It powers rich results —
the headline, author, date, and thumbnail Google shows for news, plus Top
Stories eligibility. We build the dictionaries here; the frontend embeds them in
a ``<script type="application/ld+json">`` tag, and the API also exposes them so
the frontend doesn't have to re-derive them.

See ``teaching/23-seo/02-structured-data.md``.
"""

from __future__ import annotations

from django.conf import settings


def _abs(url: str | None) -> str | None:
    """Make a stored file URL absolute against SITE_URL."""
    if not url:
        return None
    if url.startswith("http://") or url.startswith("https://"):
        return url
    return settings.SITE_URL.rstrip("/") + url


def _iso(dt) -> str | None:
    return dt.isoformat() if dt else None


def build_organization() -> dict:
    """The publisher block, reused inside every article's JSON-LD."""
    org = {
        "@type": "Organization",
        "name": settings.ORGANIZATION_NAME,
        "url": settings.SITE_URL.rstrip("/"),
    }
    if settings.ORGANIZATION_LOGO_URL:
        org["logo"] = {"@type": "ImageObject", "url": settings.ORGANIZATION_LOGO_URL}
    return org


def build_news_article(article) -> dict:
    """schema.org/NewsArticle for a single article."""
    base = settings.SITE_URL.rstrip("/")
    data = {
        "@context": "https://schema.org",
        "@type": "NewsArticle",
        "headline": article.title[:110],  # Google truncates ~110 chars
        "description": article.meta_description or article.excerpt,
        "datePublished": _iso(article.published_at),
        "dateModified": _iso(article.updated_at),
        "author": {
            "@type": "Person",
            "name": article.author.get_full_name() or article.author.username,
        },
        "publisher": build_organization(),
        "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": f"{base}/articles/{article.slug}",
        },
        "articleSection": article.category.name,
    }
    image = _abs(article.featured_image.url) if article.featured_image else None
    if image:
        data["image"] = [image]
    return data


def build_breadcrumb(crumbs: list[tuple[str, str]]) -> dict:
    """schema.org/BreadcrumbList from a list of (name, path) tuples."""
    base = settings.SITE_URL.rstrip("/")
    return {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {
                "@type": "ListItem",
                "position": i + 1,
                "name": name,
                "item": base + path,
            }
            for i, (name, path) in enumerate(crumbs)
        ],
    }


def build_video_object(video) -> dict:
    """schema.org/VideoObject for a video item."""
    base = settings.SITE_URL.rstrip("/")
    data = {
        "@context": "https://schema.org",
        "@type": "VideoObject",
        "name": video.title,
        "description": video.meta_description or video.description,
        "uploadDate": _iso(video.published_at or video.created_at),
        "publisher": build_organization(),
        "contentUrl": f"{base}/videos/{video.slug}",
    }
    if video.thumbnail:
        data["thumbnailUrl"] = [_abs(video.thumbnail.url)]
    if video.duration_seconds:
        # ISO-8601 duration, e.g. PT1M35S
        m, s = divmod(video.duration_seconds, 60)
        data["duration"] = f"PT{m}M{s}S"
    return data
