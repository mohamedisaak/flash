"""Django-admin registration for aggregated news (internal inspection)."""

from django.contrib import admin

from .models import AggregatedArticle, IngestionRun


@admin.register(AggregatedArticle)
class AggregatedArticleAdmin(admin.ModelAdmin):
    list_display = ("title", "source", "region", "published_at", "is_hidden", "is_imported")
    list_filter = ("source", "region", "is_hidden")
    search_fields = ("title", "source_name", "author")
    date_hierarchy = "published_at"
    readonly_fields = ("created_at", "updated_at", "imported_at")


@admin.register(IngestionRun)
class IngestionRunAdmin(admin.ModelAdmin):
    list_display = ("id", "created_at", "dry_run", "created_count", "updated_count", "error_count")
    list_filter = ("dry_run",)
    readonly_fields = ("created_at", "updated_at")
