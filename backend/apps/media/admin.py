from django.contrib import admin

from .models import ImageRendition


@admin.register(ImageRendition)
class ImageRenditionAdmin(admin.ModelAdmin):
    list_display = ("source_path", "size", "image_format", "width", "height", "bytes", "created_at")
    list_filter = ("size", "image_format")
    search_fields = ("source_path",)
    readonly_fields = ("source_path", "size", "image_format", "width", "height", "bytes", "file")
