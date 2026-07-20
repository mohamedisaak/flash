"""
Image processing service (Pillow).

Pure functions that do the actual image work, kept separate from the Celery task
so they're easy to unit-test without a broker. The task (``tasks.py``) is a thin
wrapper that calls ``generate_renditions``.

Pipeline per source image:
1. Open it and fix orientation.
2. For each target size, downscale (never upscale) preserving aspect ratio.
3. Encode to modern formats (WebP always; AVIF when the Pillow build supports
   it) with sensible compression.
4. Save each as an ``ImageRendition`` row + file.

See ``teaching/09-celery/03-image-pipeline.md``.
"""

from __future__ import annotations

import io

from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from PIL import Image, ImageOps, features

from .models import ImageFormat, ImageRendition, RenditionSize

# Target widths (px) per size label. Height follows to preserve aspect ratio.
SIZE_WIDTHS = {
    RenditionSize.THUMBNAIL: 160,
    RenditionSize.SMALL: 480,
    RenditionSize.MEDIUM: 960,
    RenditionSize.LARGE: 1600,
}

# WebP is universally available in Pillow; AVIF only in newer builds.
_TARGET_FORMATS = [ImageFormat.WEBP]
if features.check("avif"):
    _TARGET_FORMATS.append(ImageFormat.AVIF)


def _encode(image: Image.Image, image_format: str) -> bytes:
    """Encode a PIL image to bytes in the requested format with good defaults."""
    buffer = io.BytesIO()
    if image_format == ImageFormat.WEBP:
        image.save(buffer, format="WEBP", quality=80, method=6)
    elif image_format == ImageFormat.AVIF:
        image.save(buffer, format="AVIF", quality=60)
    else:  # JPEG fallback
        image.convert("RGB").save(buffer, format="JPEG", quality=82, optimize=True)
    return buffer.getvalue()


def generate_renditions(source_path: str) -> list[ImageRendition]:
    """Create (or refresh) all renditions for the image at ``source_path``.

    ``source_path`` is a name in the default storage (e.g. an ImageField's
    ``.name``). Returns the list of ImageRendition rows created.
    """
    with default_storage.open(source_path, "rb") as fh:
        original = Image.open(fh)
        # Respect EXIF orientation and load fully before the file closes.
        original = ImageOps.exif_transpose(original)
        original.load()

    created: list[ImageRendition] = []
    source_width = original.width

    for size, target_width in SIZE_WIDTHS.items():
        # Never upscale: cap the width at the original's.
        width = min(target_width, source_width)
        ratio = width / original.width
        height = max(1, round(original.height * ratio))
        resized = original.resize((width, height), Image.LANCZOS)

        for image_format in _TARGET_FORMATS:
            data = _encode(resized, image_format)
            # Replace any existing rendition for this (source, size, format).
            ImageRendition.objects.filter(
                source_path=source_path, size=size, image_format=image_format
            ).delete()
            rendition = ImageRendition(
                source_path=source_path,
                size=size,
                image_format=image_format,
                width=width,
                height=height,
                bytes=len(data),
            )
            filename = f"{source_path.rsplit('/', 1)[-1].rsplit('.', 1)[0]}_{size}.{image_format}"
            rendition.file.save(filename, ContentFile(data), save=False)
            rendition.save()
            created.append(rendition)

    return created
