"""Serializers for advertisements."""

from rest_framework import serializers

from .models import Advertisement


class AdvertisementSerializer(serializers.ModelSerializer):
    # CTR is a derived @property on the model — exposed read-only.
    ctr = serializers.FloatField(read_only=True)

    class Meta:
        model = Advertisement
        fields = [
            "id", "name", "placement", "image", "html", "target_url",
            "is_active", "starts_at", "ends_at", "impressions", "clicks", "ctr",
        ]
        read_only_fields = ["impressions", "clicks", "ctr"]
