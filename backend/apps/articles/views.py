"""
API viewsets for the articles app.

Highlights worth studying:
- ``get_queryset`` hides drafts from the public but shows everything to staff.
- ``get_serializer_class`` returns the light serializer for lists, the full one
  for detail/writes.
- ``perform_create`` stamps the author from the request automatically.
- A custom ``@action`` exposes /articles/{slug}/view/ to bump the view counter.

See ``teaching/06-django-rest-framework/03-viewsets-and-routers.md`` and
``teaching/06-django-rest-framework/04-queryset-scoping.md``.
"""

from django.db.models import F
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from apps.common.permissions import IsAuthorOrEditorOrReadOnly, ReadOnlyOrEditorialStaff

from .filters import ArticleFilter
from .models import Article, BreakingNewsAlert
from .serializers import (
    ArticleDetailSerializer,
    ArticleListSerializer,
    BreakingNewsAlertSerializer,
)


class ArticleViewSet(viewsets.ModelViewSet):
    """CRUD + feed for articles.

    Public callers only ever see *published* articles; authenticated newsroom
    staff see drafts/scheduled/archived too. Writes are limited to the author,
    the assigned editor, or someone who can publish.
    """

    serializer_class = ArticleDetailSerializer
    permission_classes = [IsAuthorOrEditorOrReadOnly]
    lookup_field = "slug"
    filterset_class = ArticleFilter
    search_fields = ["title", "subtitle", "excerpt", "content"]
    ordering_fields = ["published_at", "views", "created_at"]
    ordering = ["-published_at"]

    def get_queryset(self):
        related = ("author", "category")
        user = self.request.user
        if user.is_authenticated and user.is_editorial_staff:
            # Newsroom staff see everything, incl. drafts/scheduled/archived.
            return Article.objects.select_related(*related).prefetch_related("tags")
        # Everyone else: only live articles (the `published` manager applies the
        # status + published_at<=now rule in one place).
        return Article.published.select_related(*related).prefetch_related("tags")

    def get_serializer_class(self):
        if self.action == "list":
            return ArticleListSerializer
        return ArticleDetailSerializer

    def perform_create(self, serializer):
        # The author is always the logged-in user, never client-supplied.
        serializer.save(author=self.request.user)

    @action(detail=True, methods=["post"], permission_classes=[AllowAny], url_path="view")
    def register_view(self, request, slug=None):
        """POST /api/v1/articles/{slug}/view/ — atomically increment the view count.

        Uses ``F()`` so the increment happens in the database without a race
        condition between concurrent readers.
        """
        Article.objects.filter(slug=slug).update(views=F("views") + 1)
        return Response({"status": "ok"})


class BreakingNewsViewSet(viewsets.ModelViewSet):
    """Active breaking-news banners. Public reads, staff writes."""

    queryset = BreakingNewsAlert.objects.filter(is_active=True)
    serializer_class = BreakingNewsAlertSerializer
    permission_classes = [ReadOnlyOrEditorialStaff]
