"""
SEO views that don't fit the sitemap framework: the Google News sitemap and
robots.txt.

- **Google News sitemap** has a special ``<news:news>`` schema and only lists
  articles from the last 2 days (News's crawl window). We render it from a
  template.
- **robots.txt** tells crawlers what they may fetch and points them at the
  sitemaps.

See ``teaching/23-seo/03-sitemaps-and-robots.md``.
"""

from datetime import timedelta

from django.conf import settings
from django.http import HttpResponse
from django.template.loader import render_to_string
from django.utils import timezone

from apps.articles.models import Article


def google_news_sitemap(request):
    since = timezone.now() - timedelta(days=2)
    articles = (
        Article.published.filter(published_at__gte=since)
        .select_related("category")
        .order_by("-published_at")[:1000]
    )
    xml = render_to_string(
        "seo/news_sitemap.xml",
        {
            "articles": articles,
            "site_url": settings.SITE_URL.rstrip("/"),
            "publication": settings.ORGANIZATION_NAME,
        },
    )
    return HttpResponse(xml, content_type="application/xml")


def robots_txt(request):
    base = settings.SITE_URL.rstrip("/")
    lines = [
        "User-agent: *",
        "Allow: /",
        "Disallow: /admin/",
        "Disallow: /api/",
        f"Sitemap: {base}/sitemap.xml",
        f"Sitemap: {base}/news-sitemap.xml",
    ]
    return HttpResponse("\n".join(lines) + "\n", content_type="text/plain")
