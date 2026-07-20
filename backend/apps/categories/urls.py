"""Category & tag routes. A router turns each viewset into a full URL set."""

from rest_framework.routers import DefaultRouter

from .views import CategoryViewSet, TagViewSet

router = DefaultRouter()
router.register("categories", CategoryViewSet)
router.register("tags", TagViewSet)

urlpatterns = router.urls
