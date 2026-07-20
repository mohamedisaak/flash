"""
Notifications API — a user reads and dismisses *their own* notifications.

``get_queryset`` is scoped to ``request.user`` so one user can never see or touch
another's notifications. Read-only viewset + a ``mark_read`` action; creation
happens server-side (Celery, later phases), never via the API.
"""

from rest_framework import mixins, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Notification
from .serializers import NotificationSerializer


class NotificationViewSet(
    mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet
):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ["is_read", "channel", "type"]
    ordering = ["-created_at"]

    def get_queryset(self):
        # During OpenAPI schema generation there's no real user; return an empty
        # queryset so introspection doesn't choke on AnonymousUser.
        if getattr(self, "swagger_fake_view", False):
            return Notification.objects.none()
        return Notification.objects.filter(recipient=self.request.user)

    @action(detail=True, methods=["post"], url_path="mark-read")
    def mark_read(self, request, pk=None):
        self.get_queryset().filter(pk=pk).update(is_read=True)
        return Response({"status": "read"})

    @action(detail=False, methods=["post"], url_path="mark-all-read")
    def mark_all_read(self, request):
        count = self.get_queryset().filter(is_read=False).update(is_read=True)
        return Response({"status": "ok", "updated": count})
