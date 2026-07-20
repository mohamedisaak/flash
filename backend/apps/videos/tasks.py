"""
Celery tasks for video processing.

``process_video`` runs after an upload: it reads the duration, extracts a
thumbnail, and transcodes to HLS, then updates the Video row. If FFmpeg isn't
installed, it logs a warning and exits cleanly rather than failing the queue —
the video still works from its original file; it just lacks derived assets.

See ``teaching/09-celery/04-video-pipeline.md``.
"""

import logging
import os
import tempfile

from celery import shared_task
from django.core.files.storage import default_storage

from . import services
from .models import Video

logger = logging.getLogger(__name__)


@shared_task(bind=True)
def process_video(self, video_id: int) -> str:
    """Probe duration, make a thumbnail, and transcode to HLS for one Video."""
    try:
        video = Video.objects.get(pk=video_id)
    except Video.DoesNotExist:
        logger.warning("process_video: Video %s no longer exists", video_id)
        return "missing"

    if not services.ffmpeg_available():
        logger.warning("process_video: FFmpeg not installed; skipping %s", video_id)
        return "skipped-no-ffmpeg"

    # Work on a local temp copy (the source may live in remote object storage).
    source_name = video.video_file.name
    with tempfile.TemporaryDirectory() as workdir:
        local_input = os.path.join(workdir, os.path.basename(source_name))
        with default_storage.open(source_name, "rb") as src, open(local_input, "wb") as dst:
            dst.write(src.read())

        video.duration_seconds = services.probe_duration(local_input)

        thumb_path = os.path.join(workdir, "thumb.jpg")
        services.extract_thumbnail(local_input, thumb_path)
        with open(thumb_path, "rb") as th:
            from django.core.files.base import ContentFile

            video.thumbnail.save(f"{video.slug}_thumb.jpg", ContentFile(th.read()), save=False)

        hls_dir = os.path.join(workdir, "hls")
        os.makedirs(hls_dir, exist_ok=True)
        services.transcode_hls(local_input, hls_dir)
        # Persist the playlist + segments into default storage under the video's slug.
        for fname in os.listdir(hls_dir):
            from django.core.files.base import ContentFile

            with open(os.path.join(hls_dir, fname), "rb") as f:
                default_storage.save(f"videos/hls/{video.slug}/{fname}", ContentFile(f.read()))
        video.hls_playlist = f"videos/hls/{video.slug}/index.m3u8"

        video.save(update_fields=["duration_seconds", "thumbnail", "hls_playlist", "updated_at"])

    logger.info("process_video: finished %s (%ss)", video_id, video.duration_seconds)
    return "ok"
