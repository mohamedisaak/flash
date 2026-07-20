"""Video routes."""

from rest_framework.routers import DefaultRouter

from .views import VideoViewSet

router = DefaultRouter()
router.register("videos", VideoViewSet)

urlpatterns = router.urls
