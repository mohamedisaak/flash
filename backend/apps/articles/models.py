"""
Articles — the heart of the platform.

An :class:`Article` moves through an editorial workflow (Draft → Review →
Scheduled → Published → Archived), belongs to one :class:`Category`, is written
by an author (FK to the user model) and optionally shepherded by an editor.
Tags are many-to-many. Every published article also feeds SEO (it inherits
:class:`SEOFields`) and Schema.org NewsArticle output on the frontend.

Supporting models:
- :class:`ArticleRevision` — an append-only history of content snapshots so
  editors can see who changed what and recover earlier drafts.
- :class:`BreakingNewsAlert` — a promoted, time-boxed banner pointing at an
  article (or an external URL) for urgent news.

See ``teaching/05-django/models/article-model-explained.md`` and
``teaching/30-database-design/article-tables.md``.
"""

from django.conf import settings
from django.db import models
from django.utils import timezone
from django.utils.text import slugify

from apps.common.models import SEOFields, TimeStampedModel


class ArticleStatus(models.TextChoices):
    DRAFT = "draft", "Draft"
    REVIEW = "review", "In review"
    SCHEDULED = "scheduled", "Scheduled"
    PUBLISHED = "published", "Published"
    ARCHIVED = "archived", "Archived"


class PublishedArticleManager(models.Manager):
    """A custom manager exposing only live articles.

    ``Article.published.all()`` returns published, non-future rows — handy for
    public API/website queries so we don't repeat the same filter everywhere.
    """

    def get_queryset(self):
        return (
            super()
            .get_queryset()
            .filter(status=ArticleStatus.PUBLISHED, published_at__lte=timezone.now())
        )


class Article(TimeStampedModel, SEOFields):
    # --- Editorial content ---
    title = models.CharField(max_length=255)
    subtitle = models.CharField(max_length=255, blank=True)
    slug = models.SlugField(max_length=280, unique=True)
    excerpt = models.TextField(blank=True, help_text="Short summary / standfirst.")
    # Rich text/HTML produced by the Tiptap editor on the frontend.
    content = models.TextField(blank=True)

    # --- Relationships ---
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,  # never orphan/lose authored history silently
        related_name="authored_articles",
    )
    editor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="edited_articles",
    )
    category = models.ForeignKey(
        "categories.Category",
        on_delete=models.PROTECT,
        related_name="articles",
    )
    tags = models.ManyToManyField(
        "categories.Tag",
        blank=True,
        related_name="articles",
    )

    # --- Media ---
    featured_image = models.ImageField(upload_to="articles/%Y/%m/", blank=True, null=True)
    # An external lead-image URL used *instead of* uploading a file — lets editors
    # reference images where they already live online and saves server disk. When
    # set, it takes precedence over ``featured_image`` on read.
    featured_image_url = models.URLField(max_length=1000, blank=True)
    image_caption = models.CharField(max_length=255, blank=True)
    source = models.CharField(
        max_length=255, blank=True, help_text="Wire/agency credit, e.g. Reuters."
    )

    # --- Workflow ---
    status = models.CharField(
        max_length=16,
        choices=ArticleStatus.choices,
        default=ArticleStatus.DRAFT,
        db_index=True,
    )
    published_at = models.DateTimeField(
        null=True,
        blank=True,
        db_index=True,
        help_text="When the article goes/went live. Future value = scheduled.",
    )

    # --- Denormalised engagement counters (cheap reads, updated async) ---
    reading_time = models.PositiveIntegerField(default=0, help_text="Estimated minutes to read.")
    views = models.PositiveBigIntegerField(default=0)
    shares = models.PositiveBigIntegerField(default=0)
    reactions = models.PositiveBigIntegerField(default=0)

    is_breaking = models.BooleanField(default=False, db_index=True)
    is_featured = models.BooleanField(default=False, db_index=True)

    # --- Managers ---
    objects = models.Manager()  # default: everything
    published = PublishedArticleManager()  # only live articles

    class Meta:
        ordering = ("-published_at", "-created_at")
        indexes = [
            models.Index(fields=["status", "published_at"]),
            models.Index(fields=["category", "status"]),
        ]

    def __str__(self) -> str:
        return self.title

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)[:280]
        super().save(*args, **kwargs)

    @property
    def is_live(self) -> bool:
        return (
            self.status == ArticleStatus.PUBLISHED
            and self.published_at is not None
            and self.published_at <= timezone.now()
        )


class ArticleRevision(TimeStampedModel):
    """An immutable snapshot of an article's editable fields.

    Written every time an editor saves meaningful changes, giving us revision
    history and draft recovery. We store a copy rather than diffs to keep
    restore logic trivial.
    """

    article = models.ForeignKey(
        Article,
        on_delete=models.CASCADE,  # revisions die with their article
        related_name="revisions",
    )
    edited_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="article_revisions",
    )
    title = models.CharField(max_length=255)
    subtitle = models.CharField(max_length=255, blank=True)
    excerpt = models.TextField(blank=True)
    content = models.TextField(blank=True)
    note = models.CharField(max_length=255, blank=True, help_text="Optional change summary.")

    class Meta:
        ordering = ("-created_at",)

    def __str__(self) -> str:
        return f"Revision of {self.article_id} at {self.created_at:%Y-%m-%d %H:%M}"


class BreakingNewsAlert(TimeStampedModel):
    """A promoted, time-boxed alert banner for urgent news.

    Points at an internal article or an external URL. ``is_active`` plus the
    optional ``starts_at``/``expires_at`` window let editors schedule and auto-
    retire banners without deleting the record.
    """

    headline = models.CharField(max_length=200)
    article = models.ForeignKey(
        Article,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="breaking_alerts",
    )
    external_url = models.URLField(blank=True)

    is_active = models.BooleanField(default=True, db_index=True)
    starts_at = models.DateTimeField(default=timezone.now)
    expires_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ("-starts_at",)

    def __str__(self) -> str:
        return self.headline
