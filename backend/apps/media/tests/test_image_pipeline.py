"""Tests for the Pillow image rendition pipeline (service + task)."""

import io

import pytest
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from PIL import Image

from apps.media.models import ImageFormat, ImageRendition, RenditionSize
from apps.media.services import generate_renditions

pytestmark = pytest.mark.django_db


def _save_source(width=2000, height=1000, name="uploads/photo.jpg") -> str:
    buf = io.BytesIO()
    Image.new("RGB", (width, height), "steelblue").save(buf, format="JPEG")
    return default_storage.save(name, ContentFile(buf.getvalue()))


def test_generates_all_sizes_and_webp(_isolated_media_root):
    source = _save_source()
    renditions = generate_renditions(source)

    # One row per (size × format); WebP is always present.
    sizes = {r.size for r in renditions}
    assert sizes == set(RenditionSize.values)
    assert ImageFormat.WEBP in {r.image_format for r in renditions}
    assert ImageRendition.objects.filter(source_path=source).count() == len(renditions)


def test_never_upscales(_isolated_media_root):
    # Source narrower than the "large" target (1600) must not be enlarged.
    source = _save_source(width=500, height=250, name="uploads/small.jpg")
    generate_renditions(source)
    large = ImageRendition.objects.get(
        source_path=source, size=RenditionSize.LARGE, image_format=ImageFormat.WEBP
    )
    assert large.width == 500  # capped at the original width


def test_regenerating_replaces_rows(_isolated_media_root):
    source = _save_source()
    generate_renditions(source)
    first_count = ImageRendition.objects.filter(source_path=source).count()
    generate_renditions(source)  # run again
    # Same count, not doubled — the pipeline replaces existing renditions.
    assert ImageRendition.objects.filter(source_path=source).count() == first_count


def test_task_runs_eagerly(_isolated_media_root):
    from apps.media.tasks import generate_image_renditions

    source = _save_source()
    result = generate_image_renditions.delay(source)  # eager in tests
    assert result.get() == ImageRendition.objects.filter(source_path=source).count()
