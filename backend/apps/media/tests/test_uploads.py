"""Tests for the editor image-upload endpoint."""

import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient

from apps.accounts.models import Role, User

# A 1x1 PNG (smallest valid-ish payload for the endpoint's type/size checks).
_PNG = (
    b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01"
    b"\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\nIDATx\x9cc\x00\x01"
    b"\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82"
)


@pytest.fixture
def staff(db):
    return User.objects.create_user(username="ed", password="x", role=Role.EDITOR_IN_CHIEF)


@pytest.mark.django_db
def test_upload_returns_absolute_url(staff):
    c = APIClient()
    c.force_authenticate(staff)
    img = SimpleUploadedFile("photo.png", _PNG, content_type="image/png")
    resp = c.post("/api/v1/media/uploads/", {"file": img}, format="multipart")
    assert resp.status_code == 201, resp.content
    assert resp.data["url"].startswith("http")
    assert "/media/uploads/" in resp.data["url"]


@pytest.mark.django_db
def test_upload_rejects_bad_type(staff):
    c = APIClient()
    c.force_authenticate(staff)
    bad = SimpleUploadedFile("evil.svg", b"<svg/>", content_type="image/svg+xml")
    resp = c.post("/api/v1/media/uploads/", {"file": bad}, format="multipart")
    assert resp.status_code == 400


@pytest.mark.django_db
def test_upload_requires_staff(db):
    reader = User.objects.create_user(username="r", password="x", role=Role.SUBSCRIBER)
    c = APIClient()
    c.force_authenticate(reader)
    img = SimpleUploadedFile("photo.png", _PNG, content_type="image/png")
    assert c.post("/api/v1/media/uploads/", {"file": img}, format="multipart").status_code == 403
