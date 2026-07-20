from django.contrib import admin

from .models import NewsletterSubscriber


@admin.register(NewsletterSubscriber)
class NewsletterSubscriberAdmin(admin.ModelAdmin):
    list_display = ("email", "is_confirmed", "is_active", "created_at")
    list_filter = ("is_confirmed", "is_active")
    search_fields = ("email",)
    readonly_fields = ("token",)
