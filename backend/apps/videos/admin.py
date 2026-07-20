from django.contrib import admin

from .models import Video


@admin.register(Video)
class VideoAdmin(admin.ModelAdmin):
    list_display = ("title", "category", "author", "duration_seconds", "published_at", "views")
    list_filter = ("category",)
    search_fields = ("title", "description")
    prepopulated_fields = {"slug": ("title",)}
    autocomplete_fields = ("category", "tags", "author")
    readonly_fields = ("views", "duration_seconds", "hls_playlist")
