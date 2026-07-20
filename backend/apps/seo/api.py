"""
Structured-data API endpoints.

These expose ready-made JSON-LD so the frontend can embed it without re-deriving
schema.org shapes. Kept in the ``seo`` app (which already depends on the content
apps) so the content apps stay unaware of SEO — a one-way dependency.

See ``teaching/23-seo/02-structured-data.md``.
"""

from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework.generics import get_object_or_404
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.articles.models import Article
from apps.videos.models import Video

from . import structured_data

_JSONLD_RESPONSE = OpenApiResponse(description="A schema.org JSON-LD document.")


class OrganizationJsonLd(APIView):
    """GET /api/v1/seo/organization/ — the publisher's Organization JSON-LD."""

    permission_classes = [AllowAny]

    @extend_schema(responses={200: _JSONLD_RESPONSE})
    def get(self, request):
        return Response(structured_data.build_organization())


class ArticleJsonLd(APIView):
    """GET /api/v1/seo/articles/<slug>/ — NewsArticle + BreadcrumbList JSON-LD."""

    permission_classes = [AllowAny]

    @extend_schema(responses={200: _JSONLD_RESPONSE})
    def get(self, request, slug):
        article = get_object_or_404(Article.published, slug=slug)
        return Response(
            {
                "newsArticle": structured_data.build_news_article(article),
                "breadcrumb": structured_data.build_breadcrumb(
                    [
                        ("Home", "/"),
                        (article.category.name, f"/{article.category.slug}"),
                        (article.title, f"/articles/{article.slug}"),
                    ]
                ),
            }
        )


class VideoJsonLd(APIView):
    """GET /api/v1/seo/videos/<slug>/ — VideoObject JSON-LD."""

    permission_classes = [AllowAny]

    @extend_schema(responses={200: _JSONLD_RESPONSE})
    def get(self, request, slug):
        video = get_object_or_404(Video, slug=slug)
        return Response(structured_data.build_video_object(video))
