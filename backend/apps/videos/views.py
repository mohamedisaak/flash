"""API viewset for videos. Public reads, editorial writes."""

from rest_framework import viewsets

from apps.common.permissions import ReadOnlyOrEditorialStaff

from .models import Video
from .serializers import VideoSerializer


class VideoViewSet(viewsets.ModelViewSet):
    queryset = Video.objects.select_related("category", "author").prefetch_related("tags")
    serializer_class = VideoSerializer
    permission_classes = [ReadOnlyOrEditorialStaff]
    lookup_field = "slug"
    filterset_fields = ["category"]
    search_fields = ["title", "description"]
    ordering_fields = ["published_at", "views", "created_at"]
    ordering = ["-published_at"]

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)
