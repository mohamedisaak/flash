"""
Root URL configuration for the Flash news platform.

Layout:
- ``/admin/``            Django admin (schema inspection & internal editing)
- ``/api/v1/``           the versioned REST API (see config/api_v1.py)
- ``/api/schema/``       raw OpenAPI 3 schema (drf-spectacular)
- ``/api/docs/``         Swagger UI  (interactive API explorer)
- ``/api/redoc/``        ReDoc UI    (reference-style API docs)

See ``teaching/10-api-design/`` for how the URL layer maps requests to views.
"""

from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.contrib.sitemaps.views import sitemap
from django.urls import include, path
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)

from apps.seo.feeds import CategoryFeed, LatestArticlesFeed
from apps.seo.sitemaps import SITEMAPS
from apps.seo.views import google_news_sitemap, robots_txt

urlpatterns = [
    path("admin/", admin.site.urls),
    # REST API v1
    path("api/v1/", include(("config.api_v1", "v1"), namespace="v1")),
    # API documentation
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("api/redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),
    # SEO: sitemaps, Google News sitemap, robots.txt, RSS feeds
    path("sitemap.xml", sitemap, {"sitemaps": SITEMAPS}, name="sitemap"),
    path("news-sitemap.xml", google_news_sitemap, name="news-sitemap"),
    path("robots.txt", robots_txt, name="robots"),
    path("rss/", LatestArticlesFeed(), name="rss-latest"),
    path("rss/<slug:slug>/", CategoryFeed(), name="rss-category"),
]

# Serve user-uploaded media via Django during local development only.
# In production, Nginx serves MEDIA_ROOT directly (see infrastructure/).
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
