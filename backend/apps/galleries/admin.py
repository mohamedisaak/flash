from django.contrib import admin

from .models import GalleryImage, PhotoGallery


class GalleryImageInline(admin.TabularInline):
    model = GalleryImage
    extra = 1
    fields = ("image", "caption", "credit", "order")


@admin.register(PhotoGallery)
class PhotoGalleryAdmin(admin.ModelAdmin):
    list_display = ("title", "category", "author", "published_at")
    list_filter = ("category",)
    search_fields = ("title", "description")
    prepopulated_fields = {"slug": ("title",)}
    autocomplete_fields = ("category", "author")
    inlines = [GalleryImageInline]
