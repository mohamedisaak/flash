"""
Shared pagination for list endpoints.

Pagination means: instead of returning a whole table in one response, return one
"page" of results plus links to the next/previous pages. This protects the
server and the client from huge payloads. See
``teaching/10-api-design/03-pagination-filtering-sorting.md``.
"""

from rest_framework.pagination import PageNumberPagination


class DefaultPagination(PageNumberPagination):
    """Page-number pagination: ``?page=2&page_size=50``.

    - ``page_size`` defaults to 20 (from settings' ``PAGE_SIZE``).
    - Clients may request a bigger page via ``page_size``, capped at 100 so a
      caller can't ask for everything at once.
    """

    page_size_query_param = "page_size"
    max_page_size = 100
