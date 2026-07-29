"""Serializers for the CMS/site-config models."""

from rest_framework import serializers

from .models import FAQ, Language, LiveChannel, Poll, SiteSetting, SocialItem, StaticPage


class SiteSettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = SiteSetting
        fields = [
            "id",
            "site_name",
            "contact_email",
            "contact_phone",
            "contact_address",
            "about_us",
            "news_ticker_total",
            "video_item_total",
            "theme_color_1",
            "theme_color_2",
            "google_analytics_id",
            "disqus_code",
            "logo",
            "favicon",
            "date_status",
            "email_status",
            "news_ticker_status",
        ]


class SocialItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = SocialItem
        fields = ["id", "name", "icon", "url", "order"]


class LiveChannelSerializer(serializers.ModelSerializer):
    class Meta:
        model = LiveChannel
        fields = ["id", "title", "url", "thumbnail", "is_active", "order"]


class FAQSerializer(serializers.ModelSerializer):
    class Meta:
        model = FAQ
        fields = ["id", "question", "answer", "order", "is_active"]


class StaticPageSerializer(serializers.ModelSerializer):
    key_display = serializers.CharField(source="get_key_display", read_only=True)

    class Meta:
        model = StaticPage
        fields = ["id", "key", "key_display", "title", "content", "is_active"]


class PollSerializer(serializers.ModelSerializer):
    total_votes = serializers.IntegerField(read_only=True)

    class Meta:
        model = Poll
        fields = ["id", "question", "yes_votes", "no_votes", "total_votes", "is_active"]
        read_only_fields = ["yes_votes", "no_votes", "total_votes"]


class LanguageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Language
        fields = ["id", "name", "code", "is_default"]
