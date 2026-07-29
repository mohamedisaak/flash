from django.apps import AppConfig


class CategoriesConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.categories"
    verbose_name = "Categories & Tags"

    def ready(self) -> None:
        from . import signals

        signals.connect()
