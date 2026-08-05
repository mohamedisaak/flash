"""
Serializers for the articles app.

We use **two** serializers for articles:
- ``ArticleListSerializer`` — a lightweight shape for feeds/lists (no full body).
- ``ArticleDetailSerializer`` — the full article for a single-article page.

This "list vs detail" split is a common API-design habit: list endpoints should
stay small and fast. See ``teaching/10-api-design/02-rest-and-resources.md``.
"""

from rest_framework import serializers

from apps.categories.models import Category, Tag
from apps.categories.serializers import CategorySerializer, TagSerializer

from .models import Article, BreakingNewsAlert


class AuthorMiniSerializer(serializers.Serializer):
    """A tiny read-only author card embedded in article responses."""

    id = serializers.IntegerField()
    username = serializers.CharField()
    full_name = serializers.CharField(source="get_full_name")
    avatar = serializers.ImageField()


class _EffectiveImageMixin:
    """Return the article's lead image: the external URL if set, else the upload.

    Centralising this here means every client reads one ``featured_image`` field
    and never has to know whether the image was uploaded or referenced by URL.
    """

    def get_featured_image(self, obj) -> str | None:
        if obj.featured_image_url:
            return obj.featured_image_url
        if obj.featured_image:
            request = self.context.get("request")
            url = obj.featured_image.url
            return request.build_absolute_uri(url) if request else url
        return None


class ArticleListSerializer(_EffectiveImageMixin, serializers.ModelSerializer):
    author = AuthorMiniSerializer(read_only=True)
    category = CategorySerializer(read_only=True)
    featured_image = serializers.SerializerMethodField()

    class Meta:
        model = Article
        fields = [
            "id",
            "title",
            "subtitle",
            "slug",
            "excerpt",
            "author",
            "category",
            "featured_image",
            "status",
            "published_at",
            "reading_time",
            "views",
            "is_breaking",
            "is_featured",
        ]


class ArticleDetailSerializer(_EffectiveImageMixin, serializers.ModelSerializer):
    # Read side: rich nested objects. Write side: accept ids for the relations.
    author = AuthorMiniSerializer(read_only=True)
    category = CategorySerializer(read_only=True)
    tags = TagSerializer(many=True, read_only=True)

    # Lead image: read the effective URL (upload or external); write either an
    # uploaded file (`featured_image_file`, multipart) or an external URL
    # (`featured_image_url`).
    featured_image = serializers.SerializerMethodField()
    featured_image_file = serializers.ImageField(
        source="featured_image", write_only=True, required=False, allow_null=True
    )

    category_id = serializers.PrimaryKeyRelatedField(
        source="category", queryset=Category.objects.all(), write_only=True
    )
    tag_ids = serializers.PrimaryKeyRelatedField(
        source="tags", queryset=Tag.objects.all(), many=True, write_only=True, required=False
    )

    class Meta:
        model = Article
        fields = [
            "id",
            "title",
            "subtitle",
            "slug",
            "excerpt",
            "content",
            "author",
            "category",
            "category_id",
            "tags",
            "tag_ids",
            "featured_image",
            "featured_image_file",
            "featured_image_url",
            "image_caption",
            "source",
            "status",
            "published_at",
            "reading_time",
            "views",
            "shares",
            "reactions",
            "is_breaking",
            "is_featured",
            "seo_title",
            "meta_description",
            "meta_keywords",
            "canonical_url",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["slug", "views", "shares", "reactions", "created_at", "updated_at"]


class BreakingNewsAlertSerializer(serializers.ModelSerializer):
    class Meta:
        model = BreakingNewsAlert
        fields = [
            "id",
            "headline",
            "article",
            "external_url",
            "is_active",
            "starts_at",
            "expires_at",
        ]
