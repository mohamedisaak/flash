"""Serializers for comments."""

from rest_framework import serializers

from .models import Comment


class CommentSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source="author.get_full_name", read_only=True)
    # Read the ``reply_count`` annotation the viewset adds (one grouped query for
    # the whole page); fall back to a direct count for un-annotated instances
    # (e.g. the single object returned right after a create).
    reply_count = serializers.SerializerMethodField()

    def get_reply_count(self, obj) -> int:
        count = getattr(obj, "reply_count", None)
        return count if count is not None else obj.replies.count()

    class Meta:
        model = Comment
        fields = [
            "id",
            "article",
            "author_name",
            "parent",
            "body",
            "status",
            "report_count",
            "reply_count",
            "created_at",
        ]
        # Readers submit article/parent/body; the rest is system-controlled.
        read_only_fields = ["author_name", "status", "report_count", "reply_count", "created_at"]
