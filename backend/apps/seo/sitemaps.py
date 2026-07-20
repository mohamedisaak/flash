"""
XML sitemaps.

A sitemap is a machine-readable list of a site's URLs that tells search engines
what exists and when it last changed — so they crawl efficiently and index fresh
content quickly. Django's ``contrib.sitemaps`` framework generates the XML for
us; we just describe *which* objects to include.

Because the public pages live on the Next.js frontend (Phase 5), each sitemap's
``location`` points at the frontend path (``/articles/<slug>`` etc.), built from
``SITE_URL``. See ``teaching/23-seo/03-sitemaps-and-robots.md``.
"""

from urllib.parse import urlparse

from django.conf import settings
from django.contrib.sitemaps import Sitemap

from apps.articles.models import Article
from apps.categories.models import Category
from apps.galleries.models import PhotoGallery
from apps.videos.models import Video


class _SiteUrlDomain:
    """A minimal stand-in for a Sites-framework Site, carrying SITE_URL's host."""

    def __init__(self):
        parsed = urlparse(settings.SITE_URL)
        self.domain = parsed.netloc
        self.name = parsed.netloc


class _FrontendSitemap(Sitemap):
    """Base: emit absolute *frontend* URLs (SITE_URL host), not the API's host.

    The public pages live on the Next.js frontend, which may be on a different
    domain than this API. We override ``get_urls`` to force the domain to
    ``SITE_URL`` so the sitemap always points at the real pages.
    """

    @property
    def protocol(self) -> str:
        return urlparse(settings.SITE_URL).scheme or "https"

    def get_urls(self, page=1, site=None, protocol=None):
        return super().get_urls(page=page, site=_SiteUrlDomain(), protocol=self.protocol)

    def location(self, obj) -> str:  # pragma: no cover - trivial
        raise NotImplementedError


class ArticleSitemap(_FrontendSitemap):
    changefreq = "hourly"
    priority = 0.8
    limit = 1000  # split into paged sitemaps beyond this many URLs

    def items(self):
        return Article.published.all()

    def lastmod(self, obj):
        return obj.updated_at

    def location(self, obj):
        return f"/articles/{obj.slug}"


class CategorySitemap(_FrontendSitemap):
    changefreq = "daily"
    priority = 0.6

    def items(self):
        return Category.objects.filter(is_active=True)

    def lastmod(self, obj):
        return obj.updated_at

    def location(self, obj):
        return f"/{obj.slug}"


class VideoSitemap(_FrontendSitemap):
    changefreq = "weekly"
    priority = 0.6

    def items(self):
        return Video.objects.filter(published_at__isnull=False)

    def lastmod(self, obj):
        return obj.updated_at

    def location(self, obj):
        return f"/videos/{obj.slug}"


class GallerySitemap(_FrontendSitemap):
    changefreq = "weekly"
    priority = 0.5

    def items(self):
        return PhotoGallery.objects.filter(published_at__isnull=False)

    def lastmod(self, obj):
        return obj.updated_at

    def location(self, obj):
        return f"/galleries/{obj.slug}"


# Registry passed to the sitemap view in config/urls.py.
SITEMAPS = {
    "articles": ArticleSitemap,
    "categories": CategorySitemap,
    "videos": VideoSitemap,
    "galleries": GallerySitemap,
}
