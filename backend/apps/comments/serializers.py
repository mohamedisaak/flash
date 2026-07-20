"""Serializers for comments."""

from rest_framework import serializers

from .models import Comment


class CommentSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source="author.get_full_name", read_only=True)
    reply_count = serializers.IntegerField(source="replies.count", read_only=True)

    class Meta:
        model = Comment
        fields = [
            "id", "article", "author_name", "parent", "body",
            "status", "report_count", "reply_count", "created_at",
        ]
        # Readers submit article/parent/body; the rest is system-controlled.
        read_only_fields = ["author_name", "status", "report_count", "reply_count", "created_at"]
