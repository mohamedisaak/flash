"""
RSS feeds.

RSS is a standard XML format that lets readers, aggregators, and apps subscribe
to a stream of content. Django's ``contrib.syndication`` framework builds the XML
from a ``Feed`` class — we describe the items and how to render each one.

See ``teaching/23-seo/04-rss-feeds.md``.
"""

from django.conf import settings
from django.contrib.syndication.views import Feed
from django.shortcuts import get_object_or_404

from apps.articles.models import Article
from apps.categories.models import Category


class LatestArticlesFeed(Feed):
    title = f"{settings.ORGANIZATION_NAME} — Latest"
    description = "The latest stories."

    @property
    def link(self) -> str:
        return settings.SITE_URL.rstrip("/") + "/"

    def items(self):
        return Article.published.select_related("author", "category")[:20]

    def item_title(self, item):
        return item.title

    def item_description(self, item):
        return item.excerpt or item.meta_description

    def item_link(self, item):
        return f"{settings.SITE_URL.rstrip('/')}/articles/{item.slug}"

    def item_pubdate(self, item):
        return item.published_at

    def item_author_name(self, item):
        return item.author.get_full_name() or item.author.username


class CategoryFeed(LatestArticlesFeed):
    """Per-section feed, e.g. /rss/politics/."""

    def get_object(self, request, slug):
        return get_object_or_404(Category, slug=slug, is_active=True)

    def title(self, obj):
        return f"{settings.ORGANIZATION_NAME} — {obj.name}"

    def link(self, obj):
        return f"{settings.SITE_URL.rstrip('/')}/{obj.slug}"

    def description(self, obj):
        return f"Latest stories in {obj.name}."

    def items(self, obj):
        return Article.published.filter(category=obj).select_related("author")[:20]
