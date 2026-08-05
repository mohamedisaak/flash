"""
Aggregation admin API (staff only).

All endpoints require editorial staff (:class:`IsEditorialStaff`) — nothing here
is public. The item viewset supports listing/filtering, per-item and bulk
actions (hide, import, publish), source-level moderation, and a stats summary;
a second viewset exposes run history.

Routes (mounted under ``/api/v1/aggregation/``)::

    GET  items/                      list/filter aggregated items
    GET  items/stats/                counts by source + totals
    GET  items/sources/              the source registry (+ availability)
    POST items/run/                  {sources, max_items, dry_run} -> run summary
    POST items/bulk/                 {action, ids, category}  (publish|import_draft|
                                                     fetch_content|hide|unhide|delete)
    POST items/{id}/fetch-content/   extract the full article body
    POST items/hide-source/          {source}         (also unhide-source/)
    POST items/delete-source/        {source}
    POST items/delete-all/
    DEL  items/{id}/                 delete one
    POST items/{id}/hide/            (also unhide/)
    POST items/{id}/import/          {publish, category} -> create Article
    GET  runs/                       run history      (also DELETE runs/{id}/)
    POST runs/clear/                 wipe run history

See ``teaching/40-news-aggregation/project-files/views-explained.md``.
"""

from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.articles.serializers import ArticleListSerializer
from apps.common.permissions import IsEditorialStaff

from . import services, sources
from .models import AggregatedArticle, IngestionRun
from .serializers import (
    AggregatedArticleDetailSerializer,
    AggregatedArticleSerializer,
    IngestionRunSerializer,
)


class AggregatedArticleViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    # select_related the imported Article so the list's ``imported_article_slug``
    # field doesn't trigger a per-row lookup.
    queryset = AggregatedArticle.objects.select_related("imported_article")
    serializer_class = AggregatedArticleSerializer
    permission_classes = [IsEditorialStaff]
    filterset_fields = ["source", "region", "category", "is_hidden"]
    search_fields = ["title", "source_name", "author"]
    ordering_fields = ["published_at", "created_at"]

    def get_serializer_class(self):
        # Include the full extracted body only on retrieve (preview), not in lists.
        if self.action == "retrieve":
            return AggregatedArticleDetailSerializer
        return AggregatedArticleSerializer

    # --- Collection actions -------------------------------------------------
    @action(detail=False, methods=["get"])
    def sources(self, request):
        """The source catalogue plus current ingested counts per source."""
        from django.db.models import Count

        counts = dict(
            AggregatedArticle.objects.values_list("source")
            .annotate(n=Count("id"))
            .values_list("source", "n")
        )
        data = [
            {
                "slug": s.slug,
                "name": s.name,
                "kind": s.kind,
                "region": s.region,
                "homepage": s.homepage,
                "requires_key": s.requires_key,
                "available": s.is_available,
                "paywalled": s.paywalled,
                "count": counts.get(s.slug, 0),
            }
            for s in sources.SOURCES
        ]
        return Response(data)

    @action(detail=False, methods=["get"])
    def stats(self, request):
        from django.db.models import Count

        by_source = dict(
            AggregatedArticle.objects.values_list("source")
            .annotate(n=Count("id"))
            .values_list("source", "n")
        )
        qs = AggregatedArticle.objects
        return Response(
            {
                "total": qs.count(),
                "hidden": qs.filter(is_hidden=True).count(),
                "imported": qs.filter(imported_article__isnull=False).count(),
                "by_source": by_source,
            }
        )

    @action(detail=False, methods=["get"])
    def categories(self, request):
        """The category catalogue for section-scoped Kenyan crawling."""
        return Response(
            [{"slug": c.slug, "label": c.label} for c in sources.CATEGORIES]
        )

    @action(detail=False, methods=["post"])
    def run(self, request):
        """Trigger an ingestion run synchronously and return its summary.

        ``categories`` (optional list of slugs) switches on section-scoped
        crawling of the chosen Kenyan sources.
        """
        data = request.data or {}
        slugs = data.get("sources") or None
        cats = data.get("categories") or None
        try:
            max_items = min(int(data.get("max_items", 25)), 100)
        except (TypeError, ValueError):
            max_items = 25
        summary = services.run_ingestion(
            slugs=slugs,
            categories=cats,
            max_items=max_items,
            dry_run=bool(data.get("dry_run", False)),
            user=request.user,
        )
        return Response(summary)

    @action(detail=False, methods=["post"])
    def bulk(self, request):
        """Bulk action over selected ids: publish | import_draft | hide | unhide | delete."""
        data = request.data or {}
        act = data.get("action")
        ids = data.get("ids") or []
        if not ids:
            return Response({"detail": "No ids provided."}, status=status.HTTP_400_BAD_REQUEST)

        if act in {"publish", "import_draft"}:
            result = services.bulk_import(
                ids, request.user, publish=(act == "publish"), category_slug=data.get("category")
            )
            return Response(result)
        if act == "fetch_content":
            return Response(services.bulk_fetch_content(ids))
        if act in {"hide", "unhide"}:
            n = AggregatedArticle.objects.filter(id__in=ids).update(is_hidden=(act == "hide"))
            return Response({"updated": n})
        if act == "delete":
            n, _ = AggregatedArticle.objects.filter(id__in=ids).delete()
            return Response({"deleted": n})
        return Response({"detail": f"Unknown action '{act}'."}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=["post"], url_path="hide-source")
    def hide_source(self, request):
        n = services.hide_source(request.data.get("source", ""), hidden=True)
        return Response({"updated": n})

    @action(detail=False, methods=["post"], url_path="unhide-source")
    def unhide_source(self, request):
        n = services.hide_source(request.data.get("source", ""), hidden=False)
        return Response({"updated": n})

    @action(detail=False, methods=["post"], url_path="delete-source")
    def delete_source(self, request):
        n = services.delete_source(request.data.get("source", ""))
        return Response({"deleted": n})

    @action(detail=False, methods=["post"], url_path="delete-all")
    def delete_all(self, request):
        n = services.delete_all()
        return Response({"deleted": n})

    # --- Per-item actions ---------------------------------------------------
    @action(detail=True, methods=["post"])
    def hide(self, request, pk=None):
        obj = self.get_object()
        obj.is_hidden = True
        obj.save(update_fields=["is_hidden", "updated_at"])
        return Response({"status": "ok"})

    @action(detail=True, methods=["post"])
    def unhide(self, request, pk=None):
        obj = self.get_object()
        obj.is_hidden = False
        obj.save(update_fields=["is_hidden", "updated_at"])
        return Response({"status": "ok"})

    @action(detail=True, methods=["post"], url_path="fetch-content")
    def fetch_content(self, request, pk=None):
        """Extract (or re-extract) the full article body for this item."""
        obj = self.get_object()
        found = services.fetch_full_content(obj)
        return Response({"status": "ok", "has_content": found})

    @action(detail=True, methods=["post"], url_path="import")
    def import_item(self, request, pk=None):
        """Promote this item into an editorial Article (draft, or published)."""
        obj = self.get_object()
        data = request.data or {}
        publish = bool(data.get("publish", False))
        article = services.import_to_article(
            obj, request.user, publish=publish, category_slug=data.get("category")
        )
        return Response(
            {"status": "ok", "published": publish, "article": ArticleListSerializer(article).data},
            status=status.HTTP_201_CREATED,
        )


class IngestionRunViewSet(mixins.ListModelMixin, mixins.DestroyModelMixin, viewsets.GenericViewSet):
    queryset = IngestionRun.objects.all()
    serializer_class = IngestionRunSerializer
    permission_classes = [IsEditorialStaff]

    @action(detail=False, methods=["post"])
    def clear(self, request):
        n, _ = IngestionRun.objects.all().delete()
        return Response({"deleted": n})
