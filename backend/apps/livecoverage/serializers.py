"""Serializers for live blogs and their streaming updates."""

from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from apps.categories.models import Category

from .models import LiveBlog, LiveBlogUpdate


class LiveBlogUpdateSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source="author.get_full_name", read_only=True)

    class Meta:
        model = LiveBlogUpdate
        fields = ["id", "live_blog", "author_name", "headline", "body", "is_pinned", "created_at"]
        read_only_fields = ["author_name", "created_at"]


class LiveBlogSerializer(serializers.ModelSerializer):
    category_id = serializers.PrimaryKeyRelatedField(
        source="category", queryset=Category.objects.all(), write_only=True
    )
    latest_updates = serializers.SerializerMethodField()

    class Meta:
        model = LiveBlog
        fields = [
            "id", "title", "slug", "summary", "category", "category_id",
            "status", "starts_at", "ended_at", "latest_updates",
        ]
        read_only_fields = ["slug", "category"]

    @extend_schema_field(LiveBlogUpdateSerializer(many=True))
    def get_latest_updates(self, obj):
        """Embed the 5 most recent updates so a single fetch renders the page."""
        qs = obj.updates.all()[:5]
        return LiveBlogUpdateSerializer(qs, many=True).data
