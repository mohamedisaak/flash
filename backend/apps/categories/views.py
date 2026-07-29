"""
API viewsets for categories and tags.

A **ViewSet** bundles the standard list/create/retrieve/update/destroy actions
for a resource into one class; the router then generates all the URLs. See
``teaching/06-django-rest-framework/03-viewsets-and-routers.md``.
"""

from django.db.models import Count
from rest_framework import viewsets

from apps.common.permissions import ReadOnlyOrEditorialStaff

from .models import Category, Tag
from .serializers import CategorySerializer, TagSerializer
from .services import ANNOTATION_ATTR


class CategoryViewSet(viewsets.ModelViewSet):
    """CRUD for categories. Public can read; only editorial staff can write."""

    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [ReadOnlyOrEditorialStaff]
    lookup_field = "slug"  # /api/v1/categories/politics/ instead of /.../3/
    filterset_fields = ["is_active", "parent"]
    search_fields = ["name", "description"]
    ordering_fields = ["order", "name", "created_at"]

    def get_queryset(self):
        # Compute every row's article_count in one grouped query (instead of a
        # COUNT per serialized category). The serializer reads this annotation.
        qs = super().get_queryset().annotate(**{ANNOTATION_ATTR: Count("articles")})
        # ?level=top → only top-level sections; ?level=sub → only subcategories.
        level = self.request.query_params.get("level")
        if level == "top":
            return qs.filter(parent__isnull=True)
        if level == "sub":
            return qs.filter(parent__isnull=False)
        return qs


class TagViewSet(viewsets.ModelViewSet):
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    permission_classes = [ReadOnlyOrEditorialStaff]
    lookup_field = "slug"
    search_fields = ["name"]
    ordering_fields = ["name"]
