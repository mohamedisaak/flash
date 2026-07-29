"""
CMS & site-configuration models.

These back the "back office" sections of the admin dashboard that don't belong
to a specific content domain: global site settings, social links, live TV
channels, FAQs, static pages, online polls, and languages. Grouping these small
config/content models in one app keeps them cohesive.

See ``teaching/30-database-design/cms-tables.md``.
"""

from django.db import models

from apps.common.models import TimeStampedModel


class SiteSetting(TimeStampedModel):
    """Global site settings — a singleton row (always pk=1).

    Rather than a settings *table* with many rows, we keep exactly one row and
    read/update it. ``load()`` returns it, creating it on first use.
    """

    site_name = models.CharField(max_length=120, default="Flash News")
    contact_email = models.EmailField(default="contact@flashnews.dev")
    contact_phone = models.CharField(max_length=40, blank=True, default="")
    contact_address = models.CharField(max_length=255, blank=True, default="")
    about_us = models.TextField(
        blank=True,
        default="Flash News is a demo news platform built as a full-stack learning "
        "project — covering the backend API, SEO, the website, and the mobile app.",
        help_text="Short 'About Us' blurb shown in the site footer.",
    )
    news_ticker_total = models.PositiveIntegerField(default=10)
    video_item_total = models.PositiveIntegerField(default=6)
    theme_color_1 = models.CharField(max_length=9, default="#4f63d2")
    theme_color_2 = models.CharField(max_length=9, default="#1dc175")
    google_analytics_id = models.CharField(max_length=40, blank=True)
    disqus_code = models.TextField(blank=True)
    logo = models.ImageField(upload_to="site/", blank=True, null=True)
    favicon = models.ImageField(upload_to="site/", blank=True, null=True)
    date_status = models.BooleanField(default=True)
    email_status = models.BooleanField(default=True)
    news_ticker_status = models.BooleanField(default=True)

    class Meta:
        verbose_name = "Site setting"

    def __str__(self) -> str:
        return self.site_name

    def save(self, *args, **kwargs):
        self.pk = 1  # enforce singleton
        super().save(*args, **kwargs)

    @classmethod
    def load(cls) -> "SiteSetting":
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj


class SocialItem(TimeStampedModel):
    """A social media link shown in the header/footer."""

    name = models.CharField(max_length=50)
    icon = models.CharField(max_length=60, help_text="Icon class, e.g. 'fab fa-facebook-f'.")
    url = models.URLField()
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ("order", "name")

    def __str__(self) -> str:
        return self.name


class LiveChannel(TimeStampedModel):
    """A live TV/stream channel embed."""

    title = models.CharField(max_length=150)
    url = models.URLField(help_text="Embed or stream URL.")
    thumbnail = models.ImageField(upload_to="live/", blank=True, null=True)
    is_active = models.BooleanField(default=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ("order", "-created_at")

    def __str__(self) -> str:
        return self.title


class FAQ(TimeStampedModel):
    """A frequently-asked question shown on the FAQ page."""

    question = models.CharField(max_length=255)
    answer = models.TextField()
    order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name = "FAQ"
        ordering = ("order", "id")

    def __str__(self) -> str:
        return self.question


class StaticPage(TimeStampedModel):
    """Editable static pages (About, Contact, Terms, etc.), keyed by slug."""

    class Key(models.TextChoices):
        ABOUT = "about", "About"
        CONTACT = "contact", "Contact"
        TERMS = "terms", "Terms and Conditions"
        PRIVACY = "privacy", "Privacy Policy"
        DISCLAIMER = "disclaimer", "Disclaimer"
        FAQ = "faq", "FAQ"

    key = models.CharField(max_length=20, choices=Key.choices, unique=True)
    title = models.CharField(max_length=150)
    content = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ("key",)

    def __str__(self) -> str:
        return self.get_key_display()


class Poll(TimeStampedModel):
    """A simple yes/no online poll."""

    question = models.CharField(max_length=255)
    yes_votes = models.PositiveIntegerField(default=0)
    no_votes = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ("-created_at",)

    def __str__(self) -> str:
        return self.question

    @property
    def total_votes(self) -> int:
        return self.yes_votes + self.no_votes


class Language(TimeStampedModel):
    """A supported UI language (name + short code)."""

    name = models.CharField(max_length=50)
    code = models.CharField(max_length=8, unique=True)
    is_default = models.BooleanField(default=False)

    class Meta:
        ordering = ("-is_default", "name")

    def __str__(self) -> str:
        return f"{self.name} ({self.code})"
