from django.contrib import admin

from .models import Comment


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ("id", "article", "author", "status", "report_count", "created_at")
    list_filter = ("status",)
    search_fields = ("body",)
    actions = ("approve_comments", "mark_spam")

    @admin.action(description="Approve selected comments")
    def approve_comments(self, request, queryset):
        queryset.update(status="approved")

    @admin.action(description="Mark selected as spam")
    def mark_spam(self, request, queryset):
        queryset.update(status="spam")
