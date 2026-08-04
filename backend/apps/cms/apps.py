from django.apps import AppConfig


class CmsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.cms"
    verbose_name = "CMS & Site Config"

    def ready(self):
        # Register the post_save/post_delete handlers that revalidate the
        # frontend cache when CMS content changes.
        from . import signals  # noqa: F401
