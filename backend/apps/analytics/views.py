"""
Analytics ingestion API.

A public (``AllowAny``) write-only endpoint the frontend calls to report a
pageview. It's deliberately throttled by the global anon rate limit. Reading
aggregated analytics (the internal dashboard) is a staff-only concern built in a
later phase, so this only exposes the ingest path for now.
"""

from rest_framework import generics
from rest_framework.permissions import AllowAny

from .models import PageView
from .serializers import PageViewIngestSerializer


class PageViewIngestView(generics.CreateAPIView):
    """POST /api/v1/analytics/pageview/ — record one pageview."""

    queryset = PageView.objects.all()
    serializer_class = PageViewIngestSerializer
    permission_classes = [AllowAny]

    def perform_create(self, serializer):
        # Derive a coarse traffic source from the referrer for cheap reporting.
        referrer = serializer.validated_data.get("referrer", "") or ""
        source = "direct"
        if referrer:
            host = referrer.split("/")[2] if "//" in referrer else referrer
            if any(s in host for s in ("google", "bing", "duckduckgo")):
                source = "search"
            elif any(s in host for s in ("facebook", "twitter", "x.com", "instagram", "linkedin")):
                source = "social"
            else:
                source = "referral"
        serializer.save(source=source)
