# The Video Pipeline (FFmpeg + Celery)

**Topic:** Celery / Media · **Level:** Intermediate

## 1. The problem

Video is heavy. From one uploaded MP4 we want: its **duration**, a **thumbnail**
poster frame, and an **HLS** version (chunks + playlist) so players can stream
adaptively. Transcoding can take *minutes* — squarely background work.

## 2. FFmpeg is a program, not a library

FFmpeg is a command-line tool. We call it with Python's `subprocess`. See
[`apps/videos/services.py`](../../backend/apps/videos/services.py):

- `probe_duration` → runs `ffprobe`, parses JSON for the length.
- `extract_thumbnail` → `ffmpeg -ss 1 -i in.mp4 -frames:v 1 thumb.jpg`.
- `transcode_hls` → `ffmpeg ... -hls_time 6 ... index.m3u8`.

## 3. What is HLS?

**HTTP Live Streaming** cuts a video into short `.ts` segments plus an `.m3u8`
playlist that lists them. The player downloads segments as it goes and can switch
quality on the fly. It's why streaming doesn't buffer the whole file first.

## 4. Graceful degradation (important pattern)

FFmpeg may not be installed (it isn't on every CI/dev box — including the one this
project was built on). The task checks first:

```python
if not services.ffmpeg_available():
    logger.warning("FFmpeg not installed; skipping %s", video_id)
    return "skipped-no-ffmpeg"
```

The video still plays from its original file — it just lacks derived assets. A
**missing optional tool degrades a feature, it doesn't crash the queue.** Tests
(`test_video_pipeline.py`) force this branch with `monkeypatch` so they pass
regardless of the host.

## 5. Work on a local temp copy

The source may live in remote object storage (S3/MinIO). The task copies it to a
`TemporaryDirectory`, runs FFmpeg on the local file, then saves the outputs back
into `default_storage`. FFmpeg can't read an S3 URL directly, so this
copy-in/copy-out is standard.

## 6. Pass the id, re-fetch inside

`process_video(video_id)` takes an **id**, not a `Video` object — then loads it
(handling the "deleted meanwhile" case). This keeps the message small and the
data fresh, a rule that applies to every task.

## 7. Exercises

- **Beginner:** What three things does `process_video` produce?
- **Intermediate:** Explain why the task copies the file locally before running
  FFmpeg.
- **Advanced:** Extend `transcode_hls` to emit two bitrates (e.g. 480p + 720p)
  and a master playlist. What changes in the model/serializer?

## 8. Interview questions

- **Junior:** What is a thumbnail/poster frame for?
- **Mid:** What is HLS and why use it over a single MP4?
- **Senior:** How should a pipeline behave when an optional external tool is
  missing or fails midway?

← [Celery topic index](README.md)
