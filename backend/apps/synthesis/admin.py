from django.contrib import admin

from .models import SynthesisJob


@admin.register(SynthesisJob)
class SynthesisJobAdmin(admin.ModelAdmin):
    list_display = ("id", "status", "provider", "model", "article", "created_by", "created_at")
    list_filter = ("status", "provider")
    search_fields = ("angle", "error", "article__title")
    readonly_fields = (
        "status",
        "provider",
        "model",
        "prompt_tokens",
        "completion_tokens",
        "duration_ms",
        "error",
        "article",
        "created_by",
        "created_at",
        "updated_at",
    )
    filter_horizontal = ("sources",)
