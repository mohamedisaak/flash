"""Tests for the video processing task's graceful degradation."""

import pytest
from django.core.files.base import ContentFile

from apps.categories.models import Category
from apps.videos import services
from apps.videos.models import Video
from apps.videos.tasks import process_video

pytestmark = pytest.mark.django_db


@pytest.fixture
def video(editor):
    category = Category.objects.create(name="News", slug="news")
    v = Video.objects.create(title="Clip", author=editor, category=category)
    v.video_file.save("clip.mp4", ContentFile(b"not-a-real-video"), save=True)
    return v


def test_skips_cleanly_without_ffmpeg(video, monkeypatch):
    # Force the "ffmpeg missing" branch regardless of the host machine.
    monkeypatch.setattr(services, "ffmpeg_available", lambda: False)
    assert process_video.delay(video.id).get() == "skipped-no-ffmpeg"


def test_missing_video_is_handled(monkeypatch):
    monkeypatch.setattr(services, "ffmpeg_available", lambda: True)
    assert process_video.delay(999999).get() == "missing"
