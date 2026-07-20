"""
Declarative filters for the article list endpoint (django-filter).

A FilterSet maps query-string params to ORM lookups, e.g.
``?category=politics&published_after=2026-01-01``. It keeps filtering logic out
of the view and makes it self-documenting in the OpenAPI schema. See
``teaching/10-api-design/03-pagination-filtering-sorting.md``.
"""

from django_filters import rest_framework as filters

from .models import Article


class ArticleFilter(filters.FilterSet):
    category = filters.CharFilter(field_name="category__slug", lookup_expr="exact")
    tag = filters.CharFilter(field_name="tags__slug", lookup_expr="exact")
    author = filters.NumberFilter(field_name="author_id")
    published_after = filters.DateTimeFilter(field_name="published_at", lookup_expr="gte")
    published_before = filters.DateTimeFilter(field_name="published_at", lookup_expr="lte")

    class Meta:
        model = Article
        fields = ["status", "is_breaking", "is_featured", "category", "tag", "author"]
