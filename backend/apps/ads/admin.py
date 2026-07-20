from django.contrib import admin

from .models import Advertisement


@admin.register(Advertisement)
class AdvertisementAdmin(admin.ModelAdmin):
    list_display = ("name", "placement", "is_active", "impressions", "clicks", "ctr_display", "ends_at")
    list_filter = ("placement", "is_active")
    search_fields = ("name",)
    readonly_fields = ("impressions", "clicks")

    @admin.display(description="CTR")
    def ctr_display(self, obj) -> str:
        return f"{obj.ctr:.2%}"
