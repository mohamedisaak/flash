"""Synthesis routes (mounted under /api/v1/synthesis/)."""

from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import SynthesisJobViewSet, SynthesisStatusView

app_name = "synthesis"

router = DefaultRouter()
router.register("jobs", SynthesisJobViewSet)

urlpatterns = [
    path("status/", SynthesisStatusView.as_view(), name="status"),
    *router.urls,
]
