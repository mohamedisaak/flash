"""Serializers for the AI-synthesis admin API."""

from rest_framework import serializers

from .models import SynthesisJob


class SynthesisJobSerializer(serializers.ModelSerializer):
    source_ids = serializers.PrimaryKeyRelatedField(source="sources", many=True, read_only=True)
    article_slug = serializers.SlugField(source="article.slug", read_only=True, default=None)
    article_title = serializers.CharField(source="article.title", read_only=True, default=None)

    class Meta:
        model = SynthesisJob
        fields = [
            "id",
            "status",
            "angle",
            "category_slug",
            "provider",
            "model",
            "prompt_tokens",
            "completion_tokens",
            "duration_ms",
            "error",
            "source_ids",
            "article",
            "article_slug",
            "article_title",
            "created_at",
        ]
        read_only_fields = fields
