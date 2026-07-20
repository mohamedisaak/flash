"""API viewsets for photo galleries and their images."""

from rest_framework import viewsets

from apps.common.permissions import ReadOnlyOrEditorialStaff

from .models import GalleryImage, PhotoGallery
from .serializers import GalleryImageSerializer, PhotoGallerySerializer


class PhotoGalleryViewSet(viewsets.ModelViewSet):
    queryset = PhotoGallery.objects.select_related("category", "author").prefetch_related("images")
    serializer_class = PhotoGallerySerializer
    permission_classes = [ReadOnlyOrEditorialStaff]
    lookup_field = "slug"
    filterset_fields = ["category"]
    search_fields = ["title", "description"]
    ordering_fields = ["published_at", "created_at"]
    ordering = ["-published_at"]

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)


class GalleryImageViewSet(viewsets.ModelViewSet):
    """Manage individual images (upload/reorder). Editorial staff only for writes."""

    queryset = GalleryImage.objects.all()
    serializer_class = GalleryImageSerializer
    permission_classes = [ReadOnlyOrEditorialStaff]
    filterset_fields = ["gallery"]
    ordering_fields = ["order"]
