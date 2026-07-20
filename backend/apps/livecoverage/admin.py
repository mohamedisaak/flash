from django.contrib import admin

from .models import LiveBlog, LiveBlogUpdate


class LiveBlogUpdateInline(admin.StackedInline):
    model = LiveBlogUpdate
    extra = 1
    fields = ("headline", "body", "is_pinned", "author")


@admin.register(LiveBlog)
class LiveBlogAdmin(admin.ModelAdmin):
    list_display = ("title", "category", "status", "starts_at", "ended_at")
    list_filter = ("status", "category")
    search_fields = ("title", "summary")
    prepopulated_fields = {"slug": ("title",)}
    inlines = [LiveBlogUpdateInline]


@admin.register(LiveBlogUpdate)
class LiveBlogUpdateAdmin(admin.ModelAdmin):
    list_display = ("live_blog", "headline", "is_pinned", "created_at")
    list_filter = ("is_pinned",)
    search_fields = ("headline", "body")
