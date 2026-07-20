from django.contrib import admin

from .models import PageView, SearchQueryLog


@admin.register(PageView)
class PageViewAdmin(admin.ModelAdmin):
    list_display = ("path", "article", "source", "read_seconds", "created_at")
    list_filter = ("source",)
    search_fields = ("path",)
    date_hierarchy = "created_at"


@admin.register(SearchQueryLog)
class SearchQueryLogAdmin(admin.ModelAdmin):
    list_display = ("query", "results_count", "created_at")
    search_fields = ("query",)
    date_hierarchy = "created_at"
