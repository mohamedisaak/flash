"""
Video processing service (FFmpeg).

FFmpeg is a command-line program (not a Python library), so we invoke it via
``subprocess``. This module wraps three operations we need:

1. ``probe_duration`` — read a video's length (via ffprobe).
2. ``extract_thumbnail`` — grab a poster frame.
3. ``transcode_hls`` — produce an adaptive HLS playlist (.m3u8 + segments).

FFmpeg may not be installed everywhere (it isn't in every dev/CI box), so
``ffmpeg_available()`` lets callers skip gracefully instead of crashing. See
``teaching/09-celery/04-video-pipeline.md``.
"""

from __future__ import annotations

import json
import shutil
import subprocess


def ffmpeg_available() -> bool:
    """True only if both ffmpeg and ffprobe are on PATH."""
    return bool(shutil.which("ffmpeg") and shutil.which("ffprobe"))


def probe_duration(input_path: str) -> int:
    """Return the integer duration in seconds of a media file."""
    result = subprocess.run(
        [
            "ffprobe", "-v", "error", "-show_entries", "format=duration",
            "-of", "json", input_path,
        ],
        capture_output=True,
        text=True,
        check=True,
    )
    duration = float(json.loads(result.stdout)["format"]["duration"])
    return int(duration)


def extract_thumbnail(input_path: str, output_path: str, at_seconds: int = 1) -> None:
    """Write a single poster frame taken ``at_seconds`` into the video."""
    subprocess.run(
        [
            "ffmpeg", "-y", "-ss", str(at_seconds), "-i", input_path,
            "-frames:v", "1", output_path,
        ],
        capture_output=True,
        check=True,
    )


def transcode_hls(input_path: str, output_dir: str) -> str:
    """Produce an HLS playlist in ``output_dir`` and return the .m3u8 path.

    HLS ("HTTP Live Streaming") chops the video into short segments plus a
    playlist, so players can adapt to network speed. This is a single-rendition
    example; production would add multiple bitrates.
    """
    playlist = f"{output_dir}/index.m3u8"
    subprocess.run(
        [
            "ffmpeg", "-y", "-i", input_path,
            "-c:v", "h264", "-c:a", "aac",
            "-hls_time", "6", "-hls_playlist_type", "vod",
            "-hls_segment_filename", f"{output_dir}/seg_%03d.ts",
            playlist,
        ],
        capture_output=True,
        check=True,
    )
    return playlist
