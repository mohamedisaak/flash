"""Article routes."""

from rest_framework.routers import DefaultRouter

from .views import ArticleViewSet, BreakingNewsViewSet

router = DefaultRouter()
router.register("articles", ArticleViewSet, basename="article")
router.register("breaking-news", BreakingNewsViewSet, basename="breaking-news")

urlpatterns = router.urls
