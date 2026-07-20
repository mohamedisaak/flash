"""
Root URL configuration for the Flash news platform.

Phase 1 only wires the Django admin (so the whole schema is inspectable) plus
media serving in development. The versioned REST API (``/api/v1/``) and its
Swagger docs are added in Phase 2. See ``teaching/10-api-design/`` for how the
URL layer maps requests to views.
"""

from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path

urlpatterns = [
    path("admin/", admin.site.urls),
]

# Serve user-uploaded media via Django during local development only.
# In production, Nginx serves MEDIA_ROOT directly (see infrastructure/).
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
