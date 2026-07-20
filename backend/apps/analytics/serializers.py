"""Serializers for analytics event ingestion."""

from rest_framework import serializers

from .models import PageView


class PageViewIngestSerializer(serializers.ModelSerializer):
    """Accepts a single pageview beacon from the client."""

    class Meta:
        model = PageView
        fields = ["article", "path", "session_key", "referrer", "read_seconds"]
