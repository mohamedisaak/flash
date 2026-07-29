"""Serializers for the aggregation admin API."""

from rest_framework import serializers

from .models import AggregatedArticle, IngestionRun


class AggregatedArticleSerializer(serializers.ModelSerializer):
    is_imported = serializers.BooleanField(read_only=True)
    imported_article_slug = serializers.SlugField(
        source="imported_article.slug", read_only=True, default=None
    )
    # A boolean keeps the list light; the full `content` is fetched via retrieve.
    has_content = serializers.SerializerMethodField()

    class Meta:
        model = AggregatedArticle
        fields = [
            "id",
            "source",
            "source_name",
            "region",
            "url",
            "title",
            "summary",
            "author",
            "image_url",
            "published_at",
            "is_hidden",
            "is_imported",
            "content_fetched",
            "has_content",
            "imported_article",
            "imported_article_slug",
            "imported_at",
            "created_at",
        ]
        read_only_fields = fields

    def get_has_content(self, obj) -> bool:
        return bool(obj.content)


class AggregatedArticleDetailSerializer(AggregatedArticleSerializer):
    """Retrieve view — includes the full extracted body for preview."""

    class Meta(AggregatedArticleSerializer.Meta):
        fields = [*AggregatedArticleSerializer.Meta.fields, "content"]
        read_only_fields = fields


class IngestionRunSerializer(serializers.ModelSerializer):
    class Meta:
        model = IngestionRun
        fields = [
            "id",
            "sources",
            "dry_run",
            "created_count",
            "updated_count",
            "skipped_count",
            "error_count",
            "detail",
            "message",
            "created_at",
        ]
        read_only_fields = fields
