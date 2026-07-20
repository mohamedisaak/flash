"""Tests for the auth endpoints: register, login (JWT), and /me/."""

import pytest
from django.contrib.auth import get_user_model

pytestmark = pytest.mark.django_db

User = get_user_model()


def test_register_creates_subscriber(api):
    resp = api.post(
        "/api/v1/auth/register/",
        {"username": "newbie", "email": "newbie@example.com", "password": "s3curePass!23"},
        format="json",
    )
    assert resp.status_code == 201
    user = User.objects.get(username="newbie")
    # New public signups can never self-assign a newsroom role.
    assert user.role == "subscriber"
    # Password is stored hashed, never as the raw value.
    assert user.password != "s3curePass!23"
    assert user.check_password("s3curePass!23")


def test_register_rejects_weak_password(api):
    resp = api.post(
        "/api/v1/auth/register/",
        {"username": "weak", "email": "weak@example.com", "password": "123"},
        format="json",
    )
    assert resp.status_code == 400


def test_login_returns_jwt_pair(api, subscriber):
    resp = api.post(
        "/api/v1/auth/login/",
        {"username": "reader", "password": "testpass12345"},
        format="json",
    )
    assert resp.status_code == 200
    assert "access" in resp.data and "refresh" in resp.data


def test_me_requires_authentication(api):
    assert api.get("/api/v1/auth/me/").status_code == 401


def test_me_returns_current_user(api, subscriber):
    api.force_authenticate(user=subscriber)
    resp = api.get("/api/v1/auth/me/")
    assert resp.status_code == 200
    assert resp.data["username"] == "reader"


def test_me_uses_token_auth_end_to_end(api, subscriber):
    """Full flow: log in, then call a protected endpoint with the Bearer token."""
    token = api.post(
        "/api/v1/auth/login/",
        {"username": "reader", "password": "testpass12345"},
        format="json",
    ).data["access"]
    api.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
    assert api.get("/api/v1/auth/me/").status_code == 200
