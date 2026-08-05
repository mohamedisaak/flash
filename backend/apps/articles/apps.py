from django.apps import AppConfig


class ArticlesConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.articles"
    verbose_name = "Articles"

    def ready(self):
        # Register the handlers that purge public pages when an article changes.
        from . import signals  # noqa: F401
