"""SEO structured-data API routes (mounted under /api/v1/seo/)."""

from django.urls import path

from .api import ArticleJsonLd, OrganizationJsonLd, VideoJsonLd

app_name = "seo"

urlpatterns = [
    path("organization/", OrganizationJsonLd.as_view(), name="organization-jsonld"),
    path("articles/<slug:slug>/", ArticleJsonLd.as_view(), name="article-jsonld"),
    path("videos/<slug:slug>/", VideoJsonLd.as_view(), name="video-jsonld"),
]
