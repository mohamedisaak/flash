"""
CMS API viewsets.

Most resources are public-read / staff-write (``ReadOnlyOrEditorialStaff``) so
the website can render footers, FAQs, polls, etc., while only newsroom staff can
edit them. Site settings are a singleton exposed via a dedicated view. Polls
accept a public vote via a custom action.

See ``teaching/06-django-rest-framework/03-viewsets-and-routers.md``.
"""

from django.db.models import F
from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework import generics, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from apps.common.permissions import IsEditorialStaff, ReadOnlyOrEditorialStaff

from .models import FAQ, Language, LiveChannel, Poll, SiteSetting, SocialItem, StaticPage
from .serializers import (
    FAQSerializer,
    LanguageSerializer,
    LiveChannelSerializer,
    PollSerializer,
    SiteSettingSerializer,
    SocialItemSerializer,
    StaticPageSerializer,
)


class SiteSettingView(generics.RetrieveUpdateAPIView):
    """GET/PATCH /api/v1/cms/settings/ — the singleton site settings row."""

    serializer_class = SiteSettingSerializer
    permission_classes = [ReadOnlyOrEditorialStaff]

    def get_object(self):
        return SiteSetting.load()


class SocialItemViewSet(viewsets.ModelViewSet):
    queryset = SocialItem.objects.all()
    serializer_class = SocialItemSerializer
    permission_classes = [ReadOnlyOrEditorialStaff]


class LiveChannelViewSet(viewsets.ModelViewSet):
    queryset = LiveChannel.objects.all()
    serializer_class = LiveChannelSerializer
    permission_classes = [ReadOnlyOrEditorialStaff]
    filterset_fields = ["is_active"]


class FAQViewSet(viewsets.ModelViewSet):
    queryset = FAQ.objects.all()
    serializer_class = FAQSerializer
    permission_classes = [ReadOnlyOrEditorialStaff]
    filterset_fields = ["is_active"]
    search_fields = ["question"]


class StaticPageViewSet(viewsets.ModelViewSet):
    queryset = StaticPage.objects.all()
    serializer_class = StaticPageSerializer
    permission_classes = [ReadOnlyOrEditorialStaff]
    filterset_fields = ["key"]


class PollViewSet(viewsets.ModelViewSet):
    queryset = Poll.objects.all()
    serializer_class = PollSerializer
    permission_classes = [ReadOnlyOrEditorialStaff]
    filterset_fields = ["is_active"]

    @extend_schema(request=None, responses={200: OpenApiResponse(description="Vote recorded.")})
    @action(detail=True, methods=["post"], permission_classes=[AllowAny])
    def vote(self, request, pk=None):
        """POST /polls/{id}/vote/ {"choice": "yes"|"no"} — cast a public vote."""
        choice = request.data.get("choice")
        field = {"yes": "yes_votes", "no": "no_votes"}.get(choice)
        if not field:
            return Response({"detail": "choice must be 'yes' or 'no'."}, status=400)
        Poll.objects.filter(pk=pk).update(**{field: F(field) + 1})
        return Response({"status": "ok"})


class LanguageViewSet(viewsets.ModelViewSet):
    queryset = Language.objects.all()
    serializer_class = LanguageSerializer
    permission_classes = [ReadOnlyOrEditorialStaff]


class DashboardStatsView(generics.GenericAPIView):
    """GET /api/v1/stats/ — counts for the admin dashboard tiles (staff only)."""

    permission_classes = [IsEditorialStaff]

    @extend_schema(responses={200: OpenApiResponse(description="Dashboard counts.")})
    def get(self, request):
        # Imported here to avoid cross-app imports at module load.
        from apps.accounts.models import Role, User
        from apps.articles.models import Article
        from apps.categories.models import Category
        from apps.galleries.models import PhotoGallery
        from apps.newsletters.models import NewsletterSubscriber
        from apps.videos.models import Video

        return Response(
            {
                "categories": Category.objects.filter(parent__isnull=True).count(),
                "subcategories": Category.objects.filter(parent__isnull=False).count(),
                "posts": Article.objects.count(),
                "photos": PhotoGallery.objects.count(),
                "videos": Video.objects.count(),
                "faqs": FAQ.objects.count(),
                "polls": Poll.objects.count(),
                "live_channels": LiveChannel.objects.count(),
                "subscribers": NewsletterSubscriber.objects.count(),
                "authors": User.objects.filter(role__in=[Role.AUTHOR, Role.JOURNALIST]).count(),
            }
        )
