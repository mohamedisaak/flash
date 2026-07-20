"""
Shared pytest fixtures for the backend test suite.

pytest-django gives us a throwaway database per test run. These fixtures build
the common actors (readers, editors) and an API client so individual tests stay
short. See ``teaching/24-testing/`` (expanded in Phase 8).
"""

import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from apps.categories.models import Category


@pytest.fixture(autouse=True)
def _allow_testserver(settings):
    """The test client sends requests to host 'testserver'; allow it."""
    if "testserver" not in settings.ALLOWED_HOSTS:
        settings.ALLOWED_HOSTS = list(settings.ALLOWED_HOSTS) + ["testserver"]


@pytest.fixture
def api():
    return APIClient()


@pytest.fixture
def make_user(db):
    User = get_user_model()

    def _make(username="user", role="subscriber", **extra):
        return User.objects.create_user(
            username=username,
            email=f"{username}@example.com",
            password="testpass12345",
            role=role,
            **extra,
        )

    return _make


@pytest.fixture
def subscriber(make_user):
    return make_user(username="reader", role="subscriber")


@pytest.fixture
def editor(make_user):
    return make_user(username="editor", role="editor_in_chief")


@pytest.fixture
def category(db):
    return Category.objects.create(name="Politics", slug="politics")
