"""Newsletter routes (mounted under /api/v1/newsletter/)."""

from django.urls import path

from .views import SubscribeView, UnsubscribeView

app_name = "newsletters"

urlpatterns = [
    path("subscribe/", SubscribeView.as_view(), name="subscribe"),
    path("unsubscribe/<str:token>/", UnsubscribeView.as_view(), name="unsubscribe"),
]
