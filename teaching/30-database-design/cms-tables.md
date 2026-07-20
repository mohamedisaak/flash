# Tables: CMS & Site Config

Real code: [`apps/cms/models.py`](../../backend/apps/cms/models.py). These back the
admin "back office" sections that aren't a specific content domain.

## `cms_sitesetting` — the singleton pattern

Global settings that a site has exactly **one** of (site name, contact email,
ticker/video counts, theme colors, GA id, Disqus code, logo/favicon). Instead of
a table with many rows, we keep **one row (pk=1)**:

```python
def save(self, *args, **kwargs):
    self.pk = 1              # always overwrite row 1
    super().save(*args, **kwargs)

@classmethod
def load(cls):
    obj, _ = cls.objects.get_or_create(pk=1)
    return obj
```

The API exposes it via a `RetrieveUpdateAPIView` (no id in the URL) at
`/api/v1/cms/settings/`. This "singleton model" is the standard Django way to
store site-wide config in the database (editable from the admin) rather than in
code.

## The simple content tables

| Table | Purpose | Notable columns |
|-------|---------|-----------------|
| `cms_socialitem` | header/footer social links | `icon` (CSS class), `url`, `order` |
| `cms_livechannel` | live TV/stream embeds | `url`, `thumbnail`, `is_active` |
| `cms_faq` | FAQ page entries | `question`, `answer`, `order`, `is_active` |
| `cms_staticpage` | editable About/Contact/Terms… | `key` (unique enum), `title`, `content` |
| `cms_poll` | yes/no online polls | `yes_votes`, `no_votes` (+ `vote` action) |
| `cms_language` | supported UI languages | `code` (unique), `is_default` |

`StaticPage.key` is a `TextChoices` enum (`about`, `contact`, `terms`, …) with
`unique=True`, so there's exactly one row per page — the admin edits its `title`
and `content` but can't create/delete arbitrary pages.

## Design notes

- **Public read, staff write.** Most of these use `ReadOnlyOrEditorialStaff`, so
  the website can render footers/FAQs/polls while only staff edit them.
- **Derived vs stored.** `Poll.total_votes` is a derived `@property`, never a
  column — the two vote counters are the source of truth.
- **Cross-app counts** for the dashboard live in a dedicated `/api/v1/stats/`
  endpoint that imports the other apps' models *inside the method* to avoid
  coupling at import time.

## Interview questions

- **Junior:** Why keep site settings in the database instead of `settings.py`?
- **Mid:** How does the singleton model guarantee one row, and what breaks if two
  are created?
- **Senior:** Trade-offs of a shared `cms` app vs one app per config concern in a
  modular monolith.

← Back to the [Database Design index](README.md)
