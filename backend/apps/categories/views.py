"""
API viewsets for categories and tags.

A **ViewSet** bundles the standard list/create/retrieve/update/destroy actions
for a resource into one class; the router then generates all the URLs. See
``teaching/06-django-rest-framework/03-viewsets-and-routers.md``.
"""

from rest_framework import viewsets

from apps.common.permissions import ReadOnlyOrEditorialStaff

from .models import Category, Tag
from .serializers import CategorySerializer, TagSerializer


class CategoryViewSet(viewsets.ModelViewSet):
    """CRUD for categories. Public can read; only editorial staff can write."""

    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [ReadOnlyOrEditorialStaff]
    lookup_field = "slug"  # /api/v1/categories/politics/ instead of /.../3/
    filterset_fields = ["is_active", "parent"]
    search_fields = ["name", "description"]
    ordering_fields = ["order", "name", "created_at"]


class TagViewSet(viewsets.ModelViewSet):
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    permission_classes = [ReadOnlyOrEditorialStaff]
    lookup_field = "slug"
    search_fields = ["name"]
    ordering_fields = ["name"]
