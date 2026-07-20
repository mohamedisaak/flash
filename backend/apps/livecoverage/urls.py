"""Live coverage routes."""

from rest_framework.routers import DefaultRouter

from .views import LiveBlogUpdateViewSet, LiveBlogViewSet

router = DefaultRouter()
router.register("live-blogs", LiveBlogViewSet)
router.register("live-updates", LiveBlogUpdateViewSet)

urlpatterns = router.urls
