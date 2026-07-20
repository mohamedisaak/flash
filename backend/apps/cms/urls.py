"""CMS routes (mounted under /api/v1/cms/)."""

from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import (
    FAQViewSet,
    LanguageViewSet,
    LiveChannelViewSet,
    PollViewSet,
    SiteSettingView,
    SocialItemViewSet,
    StaticPageViewSet,
)

app_name = "cms"

router = DefaultRouter()
router.register("social-items", SocialItemViewSet)
router.register("live-channels", LiveChannelViewSet)
router.register("faqs", FAQViewSet)
router.register("pages", StaticPageViewSet)
router.register("polls", PollViewSet)
router.register("languages", LanguageViewSet)

urlpatterns = [
    path("settings/", SiteSettingView.as_view(), name="settings"),
    *router.urls,
]
