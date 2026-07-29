"""
HTML sanitisation — defence-in-depth against stored XSS.

Any HTML that originates outside our trust boundary (chiefly full-article bodies
extracted from *other* newsrooms during aggregation) is passed through
:func:`clean_html` before it is stored and later rendered with
``dangerouslySetInnerHTML`` on the web/mobile clients. We use ``nh3`` (Rust
`ammonia` bindings): it strips ``<script>``/``<style>``, event-handler
attributes (``onclick`` …) and dangerous URL schemes (``javascript:``) while
keeping the formatting tags a news article legitimately needs.

This complements — it does not replace — escaping at the source and a strict
Content-Security-Policy on the frontend.
"""

from __future__ import annotations

import nh3

# Formatting a news body may legitimately use. Deliberately conservative: no
# <script>, <style>, <iframe>, <form>, <object>, or event handlers get through.
_ALLOWED_TAGS = {
    "p",
    "br",
    "hr",
    "span",
    "div",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "strong",
    "b",
    "em",
    "i",
    "u",
    "s",
    "sub",
    "sup",
    "mark",
    "small",
    "ul",
    "ol",
    "li",
    "blockquote",
    "q",
    "cite",
    "pre",
    "code",
    "a",
    "img",
    "figure",
    "figcaption",
    "table",
    "thead",
    "tbody",
    "tr",
    "th",
    "td",
    "caption",
}

_ALLOWED_ATTRS = {
    # Note: nh3 manages the "a" rel attribute itself via `link_rel` below, so it
    # must not be listed here.
    "a": {"href", "title", "target"},
    "img": {"src", "alt", "title", "width", "height", "loading"},
    "*": {"class"},
}


def clean_html(value: str) -> str:
    """Return ``value`` with unsafe HTML removed. Empty/blank input passes through."""
    if not value:
        return value
    return nh3.clean(
        value,
        tags=_ALLOWED_TAGS,
        attributes=_ALLOWED_ATTRS,
        # Only allow safe URL schemes for links/images (blocks javascript:, data:).
        url_schemes={"http", "https", "mailto"},
        link_rel="noopener noreferrer nofollow",
    )
