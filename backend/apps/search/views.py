"""
Search API: full-text search and autocomplete.

Both endpoints are public and paginated (search). Every search is logged to
``analytics.SearchQueryLog`` so we can later surface "top searches" and spot
queries that return nothing. The actual matching is delegated to the configured
search backend (``backends.get_search_backend``).

See ``teaching/23-seo/05-search.md``.
"""

from drf_spectacular.utils import (
    OpenApiParameter,
    OpenApiResponse,
    extend_schema,
)
from rest_framework.generics import ListAPIView
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.analytics.models import SearchQueryLog
from apps.articles.serializers import ArticleListSerializer

from .backends import get_search_backend

_Q = OpenApiParameter("q", str, description="The search query.")


class SearchView(ListAPIView):
    """GET /api/v1/search/?q=<query> — ranked article results (paginated)."""

    serializer_class = ArticleListSerializer
    permission_classes = [AllowAny]
    filter_backends = []  # the backend does the searching; skip DRF filters here

    def get_queryset(self):
        query = self.request.query_params.get("q", "")
        return get_search_backend().search_articles(query)

    def list(self, request, *args, **kwargs):
        # Run the (potentially expensive full-text) query once: the paginator
        # already computes the total, so we log that count instead of executing
        # a second COUNT over the same query.
        response = super().list(request, *args, **kwargs)
        query = request.query_params.get("q", "").strip()
        if query:
            SearchQueryLog.objects.create(
                query=query[:255],
                results_count=response.data.get("count", 0),
                session_key=request.session.session_key or "",
            )
        return response

    @extend_schema(parameters=[_Q])
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)


class AutocompleteView(APIView):
    """GET /api/v1/search/autocomplete/?q=<partial> — title suggestions."""

    permission_classes = [AllowAny]

    @extend_schema(
        parameters=[_Q],
        responses={200: OpenApiResponse(description="{'suggestions': [str, ...]}")},
    )
    def get(self, request):
        query = request.query_params.get("q", "")
        suggestions = get_search_backend().autocomplete_titles(query)
        return Response({"suggestions": suggestions})
