"""
Newsletter API: subscribe (public) and one-click unsubscribe via token.

Subscribing is intentionally open (``AllowAny``) — anyone can sign up with an
email. Unsubscribe uses the per-subscriber random ``token`` so the link works
without login and can't be guessed for someone else.
"""

from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework import generics, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import NewsletterSubscriber
from .serializers import SubscribeSerializer


class SubscribeView(generics.CreateAPIView):
    """POST /api/v1/newsletter/subscribe/ — {email, categories?}."""

    queryset = NewsletterSubscriber.objects.all()
    serializer_class = SubscribeSerializer
    permission_classes = [AllowAny]


class UnsubscribeView(APIView):
    """GET /api/v1/newsletter/unsubscribe/<token>/ — deactivate a subscription."""

    permission_classes = [AllowAny]

    @extend_schema(
        responses={
            200: OpenApiResponse(description="Unsubscribed."),
            404: OpenApiResponse(description="Invalid token."),
        }
    )
    def get(self, request, token: str):
        updated = NewsletterSubscriber.objects.filter(token=token).update(is_active=False)
        if not updated:
            return Response({"detail": "Invalid token."}, status=status.HTTP_404_NOT_FOUND)
        return Response({"status": "unsubscribed"})
