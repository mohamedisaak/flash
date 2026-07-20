"""Serializers for categories and tags."""

from rest_framework import serializers

from .models import Category, Tag


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ["id", "name", "slug"]
        read_only_fields = ["slug"]


class CategorySerializer(serializers.ModelSerializer):
    # Show how many articles are in the category without a second request.
    article_count = serializers.IntegerField(source="articles.count", read_only=True)

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
