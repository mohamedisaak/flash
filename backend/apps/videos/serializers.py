"""Serializers for videos."""

from rest_framework import serializers

from apps.categories.models import Category, Tag
from apps.categories.serializers import CategorySerializer, TagSerializer

from .models import Video


class VideoSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        source="category", queryset=Category.objects.all(), write_only=True
    )
    tag_ids = serializers.PrimaryKeyRelatedField(
        source="tags", queryset=Tag.objects.all(), many=True, write_only=True, required=False
    )

    class Meta:
        model = Video
        fields = [
            "id", "title", "slug", "description", "thumbnail", "video_file",
            "hls_playlist", "duration_seconds", "category", "category_id",
            "tags", "tag_ids", "published_at", "views",
        ]
        read_only_fields = ["slug", "hls_playlist", "duration_seconds", "views"]
