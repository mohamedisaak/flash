"""Gallery routes."""

from rest_framework.routers import DefaultRouter

from .views import GalleryImageViewSet, PhotoGalleryViewSet

router = DefaultRouter()
router.register("galleries", PhotoGalleryViewSet)
router.register("gallery-images", GalleryImageViewSet)

urlpatterns = router.urls
