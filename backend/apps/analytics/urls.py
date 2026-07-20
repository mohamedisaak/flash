"""Analytics routes (mounted under /api/v1/analytics/)."""

from django.urls import path

from .views import PageViewIngestView

app_name = "analytics"

urlpatterns = [
    path("pageview/", PageViewIngestView.as_view(), name="pageview-ingest"),
]
