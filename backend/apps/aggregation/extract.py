"""
Full-article extraction.

RSS/API feeds only give a *summary*. To ingest a whole story we fetch the
article page and pull the main body out of the surrounding site chrome (nav,
ads, related links) with ``trafilatura`` — a robust, well-maintained readability
library.

The result is stored as **clean, escaped paragraph HTML** (not the site's raw
markup): safe to render, and free of trackers/scripts. Paywalled or
membership-gated pages (e.g. Nation, Standard) yield little real text; we detect
that by word count and return ``""`` so the caller falls back to the summary.

Note the copyright dimension: extracting full bodies goes beyond
headline+link aggregation. It's an editorial/legal decision for the site owner,
made here for non-paywalled sources, and every promoted post keeps a source
credit. See ``teaching/40-news-aggregation/project-files/fetchers-explained.md``.
"""

from __future__ import annotations

import html
import logging
import re

import trafilatura

from apps.common.sanitize import clean_html

from . import google_news
from .fetchers import FetchError, _http_get

logger = logging.getLogger(__name__)
# trafilatura is chatty on odd pages — keep our logs clean.
logging.getLogger("trafilatura").setLevel(logging.ERROR)

# Below this many words we treat extraction as "no real body" (paywall/teaser).
_MIN_WORDS = 50

# The lead image is almost always in an og:image / twitter:image meta tag,
# whichever attribute order the site uses.
_META_IMAGE_RES = [
    re.compile(
        r'<meta[^>]+(?:property|name)=["\'](?:og:image(?::url)?|twitter:image)["\'][^>]+content=["\']([^"\']+)',
        re.I,
    ),
    re.compile(
        r'<meta[^>]+content=["\']([^"\']+)["\'][^>]+(?:property|name)=["\'](?:og:image(?::url)?|twitter:image)["\']',
        re.I,
    ),
]


def _lead_image(html_text: str) -> str:
    for rx in _META_IMAGE_RES:
        m = rx.search(html_text)
        if m and m.group(1).startswith("http"):
            return m.group(1)
    return ""


def extract_article(url: str) -> tuple[str, str]:
    """Return ``(body_html, image_url)`` for an article, either possibly ``""``.

    Resolves Google-News redirects, extracts the body as clean paragraph HTML,
    and reads the lead image from the page's og:image/twitter:image meta tag.
    """
    if not url:
        return "", ""
    # Google-News links are redirects — resolve to the real article first.
    if google_news.is_google_news_url(url):
        url = google_news.decode_url(url)
        if not url:
            return "", ""
    try:
        raw = _http_get(url)
    except FetchError as exc:
        logger.info("extract: fetch failed for %s: %s", url, exc)
        return "", ""

    html_text = raw.decode("utf-8", "ignore")
    text = trafilatura.extract(
        html_text,
        url=url,
        favor_precision=True,  # prefer the real article over recall/boilerplate
        include_comments=False,
        include_tables=False,
    )
    body = ""
    if text and len(text.split()) >= _MIN_WORDS:
        paras = [p.strip() for p in text.split("\n") if p.strip()]
        body = "".join(f"<p>{html.escape(p)}</p>" for p in paras)
        # Defence-in-depth: the text is already escaped, but run the assembled
        # markup through the sanitiser so nothing unsafe from an external page
        # can ever reach our stored article body.
        body = clean_html(body)
    return body, _lead_image(html_text)


def extract_content(url: str) -> str:
    """Return just the article body HTML (convenience wrapper)."""
    return extract_article(url)[0]
