"""Media routes (mounted under /api/v1/media/)."""

from django.urls import path

from .views import ImageUploadView

app_name = "media"

urlpatterns = [
    path("uploads/", ImageUploadView.as_view(), name="upload"),
]
