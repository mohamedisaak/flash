"""
Root URL configuration for the Flash news platform.

Layout:
- ``/admin/``            Django admin (schema inspection & internal editing)
- ``/api/v1/``           the versioned REST API (see config/api_v1.py)
- ``/api/schema/``       raw OpenAPI 3 schema (drf-spectacular)
- ``/api/docs/``         Swagger UI  (interactive API explorer)
- ``/api/redoc/``        ReDoc UI    (reference-style API docs)

See ``teaching/10-api-design/`` for how the URL layer maps requests to views.
"""

from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)

urlpatterns = [
    path("admin/", admin.site.urls),
    # REST API v1
    path("api/v1/", include(("config.api_v1", "v1"), namespace="v1")),
    # API documentation
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("api/redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),
]

# Serve user-uploaded media via Django during local development only.
# In production, Nginx serves MEDIA_ROOT directly (see infrastructure/).
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
