"""
API v1 URL aggregator (the "composition root" for the REST API).

Each app owns its own ``urls.py`` (routers + paths); this module is the one
place allowed to import from every app to assemble them under a single versioned
prefix. Versioning (``/api/v1/``) means we can later ship ``/api/v2/`` with
breaking changes without disturbing existing clients. See
``teaching/10-api-design/04-versioning.md``.
"""

from django.urls import include, path

urlpatterns = [
    # Auth & accounts
    path("auth/", include("apps.accounts.urls")),
    # Content resources (each include is a DRF router)
    path("", include("apps.categories.urls")),
    path("", include("apps.articles.urls")),
    path("", include("apps.videos.urls")),
    path("", include("apps.galleries.urls")),
    path("", include("apps.livecoverage.urls")),
    path("", include("apps.ads.urls")),
    path("", include("apps.comments.urls")),
    path("", include("apps.notifications.urls")),
    # Feature endpoints
    path("newsletter/", include("apps.newsletters.urls")),
    path("analytics/", include("apps.analytics.urls")),
]
