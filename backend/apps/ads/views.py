"""
API viewset for advertisements.

Public callers can list *active* ads for a placement (that's how the site/app
decides what to render) and can POST lightweight impression/click pings. Managing
the ad inventory itself requires editorial staff.
"""

from django.db.models import F
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from apps.common.permissions import ReadOnlyOrEditorialStaff

from .models import Advertisement
from .serializers import AdvertisementSerializer


class AdvertisementViewSet(viewsets.ModelViewSet):
    queryset = Advertisement.objects.all()
    serializer_class = AdvertisementSerializer
    permission_classes = [ReadOnlyOrEditorialStaff]
    filterset_fields = ["placement", "is_active"]
    ordering_fields = ["created_at"]

    @action(detail=True, methods=["post"], permission_classes=[AllowAny])
    def impression(self, request, pk=None):
        """Record one ad view (atomic increment via F())."""
        Advertisement.objects.filter(pk=pk).update(impressions=F("impressions") + 1)
        return Response({"status": "ok"})

    @action(detail=True, methods=["post"], permission_classes=[AllowAny])
    def click(self, request, pk=None):
        """Record one ad click (atomic increment via F())."""
        Advertisement.objects.filter(pk=pk).update(clicks=F("clicks") + 1)
        return Response({"status": "ok"})
