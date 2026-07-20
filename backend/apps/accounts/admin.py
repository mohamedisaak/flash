from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin

from .models import User


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    """Extends Django's built-in UserAdmin to surface our extra fields."""

    list_display = ("username", "email", "role", "status", "is_staff", "last_login")
    list_filter = ("role", "status", "is_staff", "is_superuser", "is_active")
    search_fields = ("username", "email", "first_name", "last_name", "phone")

    # Append our custom fields to the stock edit form.
    fieldsets = DjangoUserAdmin.fieldsets + (
        (
            "Newsroom profile",
            {"fields": ("phone", "avatar", "bio", "social_links", "role", "status")},
        ),
    )
