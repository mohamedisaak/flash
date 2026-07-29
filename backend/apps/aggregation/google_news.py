"""
Resolve Google-News RSS links to the real publisher URL.

Some Kenyan outlets (e.g. The Star) dropped their native RSS feeds, so we
discover their headlines through a per-site *Google News* RSS query. But Google
News item links aren't the article — they're opaque
``news.google.com/rss/articles/CBMi…`` redirects wrapped in a JavaScript
interstitial. A server-side extractor that fetches one gets Google's page, not
the story.

This module decodes that link to the underlying publisher URL using Google's
own ``batchexecute`` endpoint (the same call the interstitial makes): scrape a
signature + timestamp from the article page, POST them, and read the real URL
out of the response. It's best-effort — any failure returns ``""`` and the
caller falls back to the feed summary.

See ``teaching/40-news-aggregation/project-files/fetchers-explained.md``.
"""

from __future__ import annotations

import json
import logging
import re
import urllib.parse

from .fetchers import FetchError, _http_get

logger = logging.getLogger(__name__)

_SG_RE = re.compile(r'data-n-a-sg="([^"]+)"')
_TS_RE = re.compile(r'data-n-a-ts="([^"]+)"')
_ID_RE = re.compile(r'data-n-a-id="([^"]+)"')
_BATCH_URL = "https://news.google.com/_/DotsSplashUi/data/batchexecute"


def is_google_news_url(url: str) -> bool:
    return "news.google.com" in (url or "")


def decode_url(url: str) -> str:
    """Return the real publisher URL for a Google-News link, or ``""``."""
    try:
        article_id = url.split("/articles/")[1].split("?")[0]
    except IndexError:
        return ""

    try:
        page = _http_get(f"https://news.google.com/rss/articles/{article_id}").decode(
            "utf-8", "ignore"
        )
        sg, ts = _SG_RE.search(page), _TS_RE.search(page)
        if not (sg and ts):
            return ""
        gn_id = (
            (_ID_RE.search(page) or [None, article_id])[1] if _ID_RE.search(page) else article_id
        )

        inner = json.dumps(
            [
                "garturlreq",
                [
                    [
                        "X",
                        "X",
                        ["X", "X"],
                        None,
                        None,
                        1,
                        1,
                        "US:en",
                        None,
                        1,
                        None,
                        None,
                        None,
                        None,
                        None,
                        0,
                        1,
                    ],
                    "X",
                    "X",
                    1,
                    [1, 1, 1],
                    1,
                    1,
                    None,
                    0,
                    0,
                    None,
                    0,
                ],
                gn_id,
                ts.group(1),
                sg.group(1),
            ]
        )
        body = urllib.parse.urlencode({"f.req": json.dumps([[["Fbv4je", inner]]])}).encode()
        resp = _http_get(
            _BATCH_URL,
            data=body,
            extra_headers={"Content-Type": "application/x-www-form-urlencoded;charset=UTF-8"},
        ).decode("utf-8", "ignore")
    except FetchError as exc:
        logger.info("google_news: decode failed for %s: %s", url[:60], exc)
        return ""

    # The response embeds the target URL; take the first non-Google absolute URL.
    for candidate in re.findall(r'https?://[^\s"\\]+', resp):
        if "google.com" not in candidate and "gstatic.com" not in candidate:
            return candidate.rstrip("\\")
    return ""
