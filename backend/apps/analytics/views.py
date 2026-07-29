"""
Analytics ingestion API.

A public (``AllowAny``) write-only endpoint the frontend calls to report a
pageview. It's deliberately throttled by the global anon rate limit. Reading
aggregated analytics (the internal dashboard) is a staff-only concern built in a
later phase, so this only exposes the ingest path for now.
"""

import logging

from drf_spectacular.utils import OpenApiParameter, OpenApiResponse, extend_schema
from rest_framework import generics, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.authentication import JWTAuthentication

from apps.common.permissions import IsEditorialStaff

from . import services
from .models import PageView
from .serializers import PageViewIngestSerializer

logger = logging.getLogger(__name__)


def _request_is_editorial_staff(request) -> bool:
    """Best-effort: is this beacon from a logged-in newsroom staffer?

    The pageview endpoint is anonymous, so we authenticate *leniently* here — a
    missing, expired or invalid token just means "treat as a visitor" (record
    it), never a 401. Only a currently-valid staff token is recognised, so we can
    keep staff out of the visitor numbers without dropping real readers who
    happen to be logged in (e.g. subscribers) with a stale access token.
    """
    try:
        result = JWTAuthentication().authenticate(request)
    except Exception:  # noqa: BLE001 — a bad token must not break ingestion
        return False
    if not result:
        return False
    user, _ = result
    return bool(user and user.is_authenticated and user.is_editorial_staff)


class PageViewIngestView(generics.CreateAPIView):
    """POST /api/v1/analytics/pageview/ — record one pageview.

    Anonymous by design (no enforced auth), but if the request carries a valid
    editorial-staff token the view drops it: newsroom staff browsing their own
    site should not inflate visitor counts.
    """

    queryset = PageView.objects.all()
    serializer_class = PageViewIngestSerializer
    permission_classes = [AllowAny]
    authentication_classes = []  # authenticate leniently in create(), never 401

    def create(self, request, *args, **kwargs):
        if _request_is_editorial_staff(request):
            return Response(status=status.HTTP_204_NO_CONTENT)
        return super().create(request, *args, **kwargs)

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


class AnalyticsDashboardView(APIView):
    """GET /api/v1/analytics/dashboard/?days=30 — staff analytics summary.

    Returns visitor/pageview totals and a daily time series for the window, plus
    traffic sources, top articles, top search terms and ad performance. Ad
    counters are lifetime totals (see :mod:`~apps.analytics.services`).
    """

    permission_classes = [IsEditorialStaff]

    @extend_schema(
        parameters=[
            OpenApiParameter(
                name="days",
                type=int,
                location=OpenApiParameter.QUERY,
                description="Window size in days (1–365, default 30).",
            )
        ],
        responses={
            200: OpenApiResponse(
                description="Analytics summary: totals, time series, sources, top content, ads."
            )
        },
    )
    def get(self, request):
        try:
            days = int(request.query_params.get("days", 30))
        except (TypeError, ValueError):
            days = 30
        days = max(1, min(days, 365))
        return Response(services.dashboard_summary(days))
