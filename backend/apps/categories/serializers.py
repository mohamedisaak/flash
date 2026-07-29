"""Serializers for categories and tags."""

from rest_framework import serializers

from . import services
from .models import Category, Tag


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ["id", "name", "slug"]
        read_only_fields = ["slug"]


class CategorySerializer(serializers.ModelSerializer):
    # How many articles are in the category. Served from a queryset annotation
    # when present, else a cached count — never a per-row COUNT query. See
    # apps/categories/services.py.
    article_count = serializers.SerializerMethodField()

    def get_article_count(self, obj) -> int:
        return services.article_count(obj)

    class Meta:
        model = Category
        fields = [
            "id",
            "name",
            "slug",
            "description",
            "featured_image",
            "parent",
            "order",
            "is_active",
            "article_count",
            "seo_title",
            "meta_description",
        ]
        read_only_fields = ["slug"]
