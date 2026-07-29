"""
Reusable image tidy-up for uploaded images.

`optimize_uploaded_image` downscales an oversized upload, fixes phone-camera
orientation, strips metadata, and re-encodes it optimised — so stored images are
clean, consistent and web-appropriate instead of raw 8 MP camera dumps. It only
touches *fresh uploads* (not files already in storage), so re-saving a model
never re-compresses an existing image.

Used by ad creatives; reusable anywhere an ImageField takes user uploads.
"""

from __future__ import annotations

from io import BytesIO

from django.core.files.base import ContentFile
from django.core.files.uploadedfile import UploadedFile
from PIL import Image, ImageOps


def optimize_uploaded_image(
    field, max_size: tuple[int, int] = (1600, 1600), jpeg_quality: int = 85
) -> None:
    """Resize + re-encode a freshly uploaded image in place (no-op otherwise)."""
    if not field:
        return
    # Only process a new upload; a stored FieldFile is left untouched.
    if not isinstance(getattr(field, "file", None), UploadedFile):
        return
    try:
        field.seek(0)
        img = Image.open(field)
        img = ImageOps.exif_transpose(img)  # honour EXIF orientation
        img.thumbnail(max_size)  # cap dimensions, preserve aspect
        buf = BytesIO()
        if img.mode in ("RGBA", "LA", "P"):  # keep transparency → PNG
            img.convert("RGBA").save(buf, format="PNG", optimize=True)
            ext = "png"
        else:  # everything else → optimised JPEG
            img.convert("RGB").save(
                buf, format="JPEG", quality=jpeg_quality, optimize=True, progressive=True
            )
            ext = "jpg"
    except Exception:
        return  # never block a save because of a bad/unsupported image
    base = field.name.rsplit("/", 1)[-1].rsplit(".", 1)[0]
    field.save(f"{base}.{ext}", ContentFile(buf.getvalue()), save=False)
