"""Advertisement routes."""

from rest_framework.routers import DefaultRouter

from .views import AdvertisementViewSet

router = DefaultRouter()
router.register("ads", AdvertisementViewSet)

urlpatterns = router.urls
