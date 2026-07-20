# Tables: Videos

Real code: [`apps/videos/models.py`](../../backend/apps/videos/models.py).

## `videos_video`
| Column | Purpose |
|--------|---------|
| `title`, `slug`, `description` | identity |
| `thumbnail` | preview image |
| `video_file` | uploaded source file |
| `hls_playlist` | path to `.m3u8` produced by the FFmpeg pipeline (Phase 3) |
| `duration_seconds` | filled by the pipeline |
| `category_id` | FK→category (PROTECT) |
| `tags` | M2M→tag |
| `author_id` | FK→user (PROTECT) |
| `published_at`, `views` | scheduling + counter |
| + SEOFields + TimeStampedModel | |

`hls_playlist` and `duration_seconds` start empty on upload; a background job
transcodes the file into adaptive-bitrate HLS renditions and fills them in.

## Interview questions
- **Junior:** Why store a separate `thumbnail` instead of generating it every time?
- **Mid:** What is HLS and why serve video that way?
- **Senior:** Where should transcoding run, and how do you keep uploads responsive?
