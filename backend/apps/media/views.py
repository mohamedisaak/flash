"""
Editor image uploads.

A tiny, staff-only endpoint the article editor calls to upload an inline image
(or the featured image is sent with the article itself as multipart — this is
for images dropped *into the body*). It saves the file to the configured media
storage (local disk or S3) and returns its absolute URL, which the editor
inserts as an ``<img>``.

Kept minimal on purpose: validate type + size, store, return the URL. The
responsive-rendition pipeline (``apps/media/models.py``) can process it later.
"""

import os
from datetime import datetime

from django.core.files.storage import default_storage
from rest_framework import status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.common.permissions import IsEditorialStaff

_ALLOWED_EXT = {".jpg", ".jpeg", ".png", ".webp", ".gif"}
_MAX_BYTES = 8 * 1024 * 1024  # 8 MB


class ImageUploadView(APIView):
    """POST an image (multipart ``file``) → ``{"url": "…"}``. Staff only."""

    permission_classes = [IsEditorialStaff]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        upload = request.FILES.get("file") or request.FILES.get("image")
        if upload is None:
            return Response(
                {"detail": "No file provided (send it as multipart field 'file')."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        ext = os.path.splitext(upload.name)[1].lower()
        if ext not in _ALLOWED_EXT:
            return Response(
                {"detail": f"Unsupported type {ext!r}. Use JPG, PNG, WEBP or GIF."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if upload.size > _MAX_BYTES:
            return Response(
                {"detail": "Image too large (max 8 MB)."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # default_storage sanitises the name and de-duplicates collisions.
        path = default_storage.save(f"uploads/{datetime.now():%Y/%m}/{upload.name}", upload)
        url = request.build_absolute_uri(default_storage.url(path))
        return Response({"url": url}, status=status.HTTP_201_CREATED)
