from django.contrib import admin

from .models import DailyStat, PageView, SearchQueryLog


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


@admin.register(DailyStat)
class DailyStatAdmin(admin.ModelAdmin):
    list_display = ("date", "pageviews", "unique_sessions", "avg_read_seconds")
    date_hierarchy = "date"
    readonly_fields = ("date", "pageviews", "unique_sessions", "avg_read_seconds")
