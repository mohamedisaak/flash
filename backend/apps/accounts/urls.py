"""
Auth & account URLs, mounted under /api/v1/auth/ by the project urlconf.

- register/            POST   create an account
- login/               POST   exchange username+password for JWT access+refresh
- login/refresh/       POST   exchange a refresh token for a new access token
- me/                  GET/PATCH  the current user's profile
"""

from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import LoginView, MeView, RegisterView

app_name = "accounts"

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", LoginView.as_view(), name="login"),
    path("login/refresh/", TokenRefreshView.as_view(), name="login-refresh"),
    path("me/", MeView.as_view(), name="me"),
]
