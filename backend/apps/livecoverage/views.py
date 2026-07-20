"""
API viewsets for live coverage.

The updates endpoint supports ``?live_blog=<id>`` so a client can poll for new
posts. Only editorial staff can post updates; the author is stamped from the
request.
"""

from rest_framework import viewsets

from apps.common.permissions import IsEditorialStaff, ReadOnlyOrEditorialStaff

from .models import LiveBlog, LiveBlogUpdate
from .serializers import LiveBlogSerializer, LiveBlogUpdateSerializer


class LiveBlogViewSet(viewsets.ModelViewSet):
    queryset = LiveBlog.objects.select_related("category")
    serializer_class = LiveBlogSerializer
    permission_classes = [ReadOnlyOrEditorialStaff]
    lookup_field = "slug"
    filterset_fields = ["status", "category"]
    search_fields = ["title", "summary"]
    ordering_fields = ["starts_at", "created_at"]
    ordering = ["-starts_at"]


class LiveBlogUpdateViewSet(viewsets.ModelViewSet):
    queryset = LiveBlogUpdate.objects.select_related("author", "live_blog")
    serializer_class = LiveBlogUpdateSerializer
    filterset_fields = ["live_blog", "is_pinned"]
    ordering = ["-is_pinned", "-created_at"]

    def get_permissions(self):
        # Anyone may read the live feed; only staff may post updates.
        if self.request.method in ("GET", "HEAD", "OPTIONS"):
            return [ReadOnlyOrEditorialStaff()]
        return [IsEditorialStaff()]

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)
