"""
API viewset for comments.

- Public reads return only **approved** comments (moderation in action).
- Any authenticated user may post; the author is stamped from the request and
  new comments start as ``pending``.
- Editing/deleting is limited to the comment's owner (via IsOwnerOrReadOnly).
- A ``report`` action lets any authenticated user flag a comment.
"""

from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.common.permissions import IsOwnerOrReadOnly

from .models import Comment, CommentStatus
from .serializers import CommentSerializer


class CommentViewSet(viewsets.ModelViewSet):
    serializer_class = CommentSerializer
    permission_classes = [IsOwnerOrReadOnly]
    filterset_fields = ["article", "parent", "status"]
    ordering = ["created_at"]

    def get_queryset(self):
        qs = Comment.objects.select_related("author")
        user = self.request.user
        if user.is_authenticated and (user.is_editorial_staff):
            return qs  # moderators see the full queue incl. pending/spam
        return qs.filter(status=CommentStatus.APPROVED)

    def perform_create(self, serializer):
        # New comments are held for moderation by default.
        serializer.save(author=self.request.user, status=CommentStatus.PENDING)

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def report(self, request, pk=None):
        """Flag a comment for moderator review."""
        from django.db.models import F

        Comment.objects.filter(pk=pk).update(report_count=F("report_count") + 1)
        return Response({"status": "reported"})
