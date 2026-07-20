# Tables: Photo Galleries

Real code: [`apps/galleries/models.py`](../../backend/apps/galleries/models.py).

## `galleries_photogallery`
The container: `title`, `slug`, `description`, `category_id` (FK PROTECT),
`author_id` (FK PROTECT), `published_at`, + SEOFields + TimeStampedModel.

## `galleries_galleryimage`
The photos (one-to-many from gallery).

| Column | Purpose |
|--------|---------|
| `gallery_id` | FK→gallery (**CASCADE**) |
| `image` | the photo file |
| `caption` | text under the image |
| `credit` | photographer / agency |
| `order` | explicit display sequence |

The `order` column + index `(gallery, order)` let editors arrange photos exactly.
This is the same parent/child pattern as Article↔Revision and LiveBlog↔Update.

## Interview questions
- **Junior:** Why an explicit `order` column instead of relying on insertion order?
- **Mid:** What does `on_delete=CASCADE` guarantee here?
