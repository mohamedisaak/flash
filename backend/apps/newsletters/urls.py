"""Newsletter routes (mounted under /api/v1/newsletter/)."""

from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import SubscribeView, SubscriberViewSet, UnsubscribeView

app_name = "newsletters"

router = DefaultRouter()
router.register("subscribers", SubscriberViewSet)

urlpatterns = [
    path("subscribe/", SubscribeView.as_view(), name="subscribe"),
    path("unsubscribe/<str:token>/", UnsubscribeView.as_view(), name="unsubscribe"),
    *router.urls,
]
