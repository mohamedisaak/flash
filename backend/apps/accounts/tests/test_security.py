"""
Security regression tests.

These lock in the authorization and rate-limiting guards so a future refactor
can't silently reopen a privilege-escalation or brute-force hole.
"""

import pytest
from django.core.cache import cache
from rest_framework_simplejwt.tokens import AccessToken

pytestmark = pytest.mark.django_db


def _auth(api, user):
    api.credentials(HTTP_AUTHORIZATION=f"Bearer {AccessToken.for_user(user)}")
    return api


# --- Broken authorization / privilege escalation ---------------------------
def test_non_admin_editorial_cannot_list_or_create_users(api, make_user):
    author = make_user(username="anauthor", role="author")
    _auth(api, author)
    assert api.get("/api/v1/users/").status_code == 403
    resp = api.post(
        "/api/v1/users/",
        {"username": "x", "email": "x@example.com", "role": "super_admin"},
        format="json",
    )
    assert resp.status_code == 403


def test_editor_in_chief_cannot_manage_users(api, editor):
    _auth(api, editor)
    assert api.get("/api/v1/users/").status_code == 403


def test_user_cannot_escalate_role_via_own_profile(api, make_user):
    author = make_user(username="anauthor", role="author")
    _auth(api, author)
    resp = api.patch("/api/v1/auth/me/", {"role": "super_admin", "status": "active"}, format="json")
    assert resp.status_code == 200
    author.refresh_from_db()
    assert author.role == "author"  # role/status are read-only on the self profile


def test_admin_can_create_staff_but_not_grant_superadmin(api, make_user):
    admin = make_user(username="admin1", role="admin")
    _auth(api, admin)
    ok = api.post(
        "/api/v1/users/",
        {"username": "newauthor", "email": "na@example.com", "role": "author"},
        format="json",
    )
    assert ok.status_code == 201
    bad = api.post(
        "/api/v1/users/",
        {"username": "evil", "email": "evil@example.com", "role": "super_admin"},
        format="json",
    )
    assert bad.status_code == 400  # only a super admin may grant super_admin


def test_superadmin_can_grant_superadmin(api, make_user):
    sa = make_user(username="root", role="super_admin")
    _auth(api, sa)
    resp = api.post(
        "/api/v1/users/",
        {"username": "root2", "email": "root2@example.com", "role": "super_admin"},
        format="json",
    )
    assert resp.status_code == 201


# --- Broken authentication / brute force -----------------------------------
def test_login_is_rate_limited(api, subscriber):
    cache.clear()  # start from a clean throttle bucket
    # The `login` scope is 10/min; the 11th rapid attempt must be throttled.
    statuses = [
        api.post(
            "/api/v1/auth/login/", {"username": "reader", "password": "wrong"}, format="json"
        ).status_code
        for _ in range(12)
    ]
    assert 429 in statuses
    assert statuses[-1] == 429
