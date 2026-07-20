"""Search routes (mounted under /api/v1/search/)."""

from django.urls import path

from .views import AutocompleteView, SearchView

app_name = "search"

urlpatterns = [
    path("", SearchView.as_view(), name="search"),
    path("autocomplete/", AutocompleteView.as_view(), name="autocomplete"),
]
