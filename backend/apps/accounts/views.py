"""
API views for the accounts app: registration and the current-user endpoint.

Login/refresh are handled by simplejwt's built-in views, wired in urls.py. See
``teaching/11-authentication/02-jwt-and-drf-permissions.md``.
"""

from django.contrib.auth import get_user_model
from rest_framework import generics, permissions, viewsets
from rest_framework.throttling import ScopedRateThrottle
from rest_framework_simplejwt.views import TokenObtainPairView

from apps.common.permissions import IsAdmin

from .models import Role
from .serializers import AdminUserSerializer, RegisterSerializer, UserSerializer

User = get_user_model()


class LoginView(TokenObtainPairView):
    """POST /api/v1/auth/login/ — obtain a JWT pair.

    Rate-limited (``login`` scope, per-IP) so it can't be used for password
    brute-forcing. See settings ``DEFAULT_THROTTLE_RATES``.
    """

    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "login"


class RegisterView(generics.CreateAPIView):
    """POST /api/v1/auth/register/ — create a new subscriber account.

    ``AllowAny`` because, by definition, the caller isn't logged in yet.
    Rate-limited (``register`` scope) to stop mass/automated sign-ups.
    """

    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "register"


class MeView(generics.RetrieveUpdateAPIView):
    """GET/PATCH /api/v1/auth/me/ — read or update your own profile.

    ``get_object`` returns the *logged-in* user, so a caller can only ever see or
    edit themselves — no id in the URL, no way to touch someone else's account.
    """

    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class UserViewSet(viewsets.ModelViewSet):
    """Admin-only user management (the admin's "Author List").

    Creating, editing, deleting accounts and assigning roles is restricted to
    site administrators (``IsAdmin``) — never ordinary editorial staff — so a
    lower-privilege account cannot create users or escalate its own role.
    Defaults the ``role`` to Author when creating (the admin form can override
    it, subject to the serializer's role-assignment guard).
    """

    queryset = User.objects.all().order_by("-date_joined")
    serializer_class = AdminUserSerializer
    permission_classes = [IsAdmin]
    filterset_fields = ["role", "status"]
    search_fields = ["username", "email", "first_name", "last_name"]

    def perform_create(self, serializer):
        serializer.save(role=serializer.validated_data.get("role", Role.AUTHOR))
