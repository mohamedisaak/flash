"""Aggregation routes (mounted under /api/v1/aggregation/)."""

from rest_framework.routers import DefaultRouter

from .views import AggregatedArticleViewSet, IngestionRunViewSet

app_name = "aggregation"

router = DefaultRouter()
router.register("items", AggregatedArticleViewSet)
router.register("runs", IngestionRunViewSet)

urlpatterns = router.urls
