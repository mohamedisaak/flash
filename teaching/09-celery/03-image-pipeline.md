# The Image Pipeline (Pillow + Celery)

**Topic:** Celery / Media · **Level:** Intermediate

## 1. The problem

An editor uploads one 4000×3000, 6 MB photo. Serving that to a phone on 3G is
wasteful and slow. We want several **renditions**: smaller widths, in modern
formats (WebP/AVIF) that are far smaller than JPEG at the same quality.

Doing this during the upload request would make the editor wait seconds. So it's
a **background task**.

## 2. Service vs task (separation of concerns)

- [`apps/media/services.py`](../../backend/apps/media/services.py) — the pure
  image logic (`generate_renditions`). No Celery. Easy to unit-test.
- [`apps/media/tasks.py`](../../backend/apps/media/tasks.py) — a thin
  `@shared_task` wrapper that just calls the service.

This split is a strong habit: **keep the hard logic testable without a broker**,
and keep the task a one-liner.

## 3. What the service does

```python
for size, target_width in SIZE_WIDTHS.items():
    width = min(target_width, source_width)      # never upscale
    resized = original.resize((width, height), Image.LANCZOS)
    for image_format in _TARGET_FORMATS:          # WebP, and AVIF if supported
        data = _encode(resized, image_format)
        ...ImageRendition.objects.create(...)
```

Key decisions:
- **Never upscale** — capping width at the original avoids blurry enlargements.
- **`ImageOps.exif_transpose`** — rotate per the photo's EXIF so portraits aren't
  sideways.
- **WebP always, AVIF when the Pillow build supports it** (`features.check("avif")`).
- Each result is recorded as an [`ImageRendition`](../30-database-design/analytics-tables.md)
  row keyed by the **source path**, so the same pipeline serves any image field
  on any model.

## 4. Idempotency

Re-running regenerates cleanly: before writing a rendition it deletes the
existing one for that `(source, size, format)`. A test asserts the row count
doesn't double on a second run — important, because tasks can be retried.

## 5. Testing without a worker

`test_image_pipeline.py` sets a throwaway `MEDIA_ROOT`, saves a real generated
image, calls the service directly, and asserts sizes/formats. The task test uses
`.delay(...)` — which runs inline because tests enable eager mode. Pillow is a
normal dependency, so these tests need no Redis and no worker.

## 6. Exercises

- **Beginner:** List the renditions produced for one image (sizes × formats).
- **Intermediate:** Add a `RenditionSize.HERO` at 2400px and a test that a large
  source produces it but a 1000px source doesn't (no upscaling).
- **Advanced:** Wire a `post_save` signal on `Article` to enqueue
  `generate_image_renditions.delay(instance.featured_image.name)` when the image
  changes. Discuss the risk of infinite loops and how to avoid them.

## 7. Interview questions

- **Junior:** Why generate multiple image sizes?
- **Mid:** Why keep the image logic in a service separate from the task?
- **Senior:** How do you make a media task idempotent and safe to retry?

← [Celery topic index](README.md)
