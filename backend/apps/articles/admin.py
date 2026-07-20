from django.contrib import admin

from .models import Article, ArticleRevision, BreakingNewsAlert


class ArticleRevisionInline(admin.TabularInline):
    model = ArticleRevision
    extra = 0
    fields = ("created_at", "edited_by", "note")
    readonly_fields = ("created_at",)
    can_delete = False


@admin.register(Article)
class ArticleAdmin(admin.ModelAdmin):
    list_display = ("title", "author", "category", "status", "published_at", "is_breaking", "views")
    list_filter = ("status", "is_breaking", "is_featured", "category")
    search_fields = ("title", "subtitle", "excerpt", "content")
    prepopulated_fields = {"slug": ("title",)}
    autocomplete_fields = ("author", "editor", "category", "tags")
    date_hierarchy = "published_at"
    inlines = [ArticleRevisionInline]
    readonly_fields = ("views", "shares", "reactions")


@admin.register(BreakingNewsAlert)
class BreakingNewsAlertAdmin(admin.ModelAdmin):
    list_display = ("headline", "article", "is_active", "starts_at", "expires_at")
    list_filter = ("is_active",)
    search_fields = ("headline",)
