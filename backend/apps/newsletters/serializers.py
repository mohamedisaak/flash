"""Serializers for newsletter subscriptions."""

from rest_framework import serializers

from .models import NewsletterSubscriber


class SubscriberSerializer(serializers.ModelSerializer):
    """Read-only subscriber row for the admin's Subscribers list."""

    class Meta:
        model = NewsletterSubscriber
        fields = ["id", "email", "is_confirmed", "is_active", "created_at"]


class SubscribeSerializer(serializers.ModelSerializer):
    class Meta:
        model = NewsletterSubscriber
        fields = ["id", "email", "categories"]

    def create(self, validated_data):
        categories = validated_data.pop("categories", [])
        # Re-subscribing with a known email updates prefs instead of erroring.
        subscriber, _ = NewsletterSubscriber.objects.get_or_create(
            email=validated_data["email"], defaults={"is_active": True}
        )
        subscriber.is_active = True
        subscriber.save()
        if categories:
            subscriber.categories.set(categories)
        return subscriber
