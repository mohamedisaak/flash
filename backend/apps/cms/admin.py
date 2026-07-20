from django.contrib import admin

from .models import FAQ, Language, LiveChannel, Poll, SiteSetting, SocialItem, StaticPage


@admin.register(SiteSetting)
class SiteSettingAdmin(admin.ModelAdmin):
    list_display = ("site_name", "contact_email", "news_ticker_total")


@admin.register(SocialItem)
class SocialItemAdmin(admin.ModelAdmin):
    list_display = ("name", "icon", "url", "order")


@admin.register(LiveChannel)
class LiveChannelAdmin(admin.ModelAdmin):
    list_display = ("title", "url", "is_active", "order")
    list_filter = ("is_active",)


@admin.register(FAQ)
class FAQAdmin(admin.ModelAdmin):
    list_display = ("question", "order", "is_active")
    list_filter = ("is_active",)
    search_fields = ("question",)


@admin.register(StaticPage)
class StaticPageAdmin(admin.ModelAdmin):
    list_display = ("key", "title", "is_active")


@admin.register(Poll)
class PollAdmin(admin.ModelAdmin):
    list_display = ("question", "yes_votes", "no_votes", "is_active")
    list_filter = ("is_active",)


@admin.register(Language)
class LanguageAdmin(admin.ModelAdmin):
    list_display = ("name", "code", "is_default")
