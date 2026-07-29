"""
API viewset for comments.

- Public reads return only **approved** comments (moderation in action).
- Any authenticated user may post; the author is stamped from the request and
  new comments start as ``pending``.
- Editing/deleting is limited to the comment's owner (via IsOwnerOrReadOnly).
- A ``report`` action lets any authenticated user flag a comment.
"""

from django.db.models import Count
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle

from apps.common.permissions import IsOwnerOrReadOnly

from .models import Comment, CommentStatus
from .serializers import CommentSerializer


class CommentViewSet(viewsets.ModelViewSet):
    serializer_class = CommentSerializer
    permission_classes = [IsOwnerOrReadOnly]
    filterset_fields = ["article", "parent", "status"]
    ordering = ["created_at"]
    # Scope used by ScopedRateThrottle on the `report` action (inert elsewhere).
    throttle_scope = "report"

    def get_queryset(self):
        # select_related("author") avoids a per-row author lookup for
        # ``author_name``; the Count annotation avoids a per-row COUNT for
        # ``reply_count`` (see CommentSerializer).
        qs = Comment.objects.select_related("author").annotate(reply_count=Count("replies"))
        user = self.request.user
        if user.is_authenticated and (user.is_editorial_staff):
            return qs  # moderators see the full queue incl. pending/spam
        return qs.filter(status=CommentStatus.APPROVED)

    def perform_create(self, serializer):
        # New comments are held for moderation by default.
        serializer.save(author=self.request.user, status=CommentStatus.PENDING)

    @action(
        detail=True,
        methods=["post"],
        permission_classes=[IsAuthenticated],
        throttle_classes=[ScopedRateThrottle],
    )
    def report(self, request, pk=None):
        """Flag a comment for moderator review (rate-limited to curb report spam)."""
        from django.db.models import F

        Comment.objects.filter(pk=pk).update(report_count=F("report_count") + 1)
        return Response({"status": "reported"})
