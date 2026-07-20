"""Serializers for notifications."""

from rest_framework import serializers

from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ["id", "channel", "type", "title", "body", "payload", "is_read", "created_at"]
        read_only_fields = fields  # notifications are created server-side only
