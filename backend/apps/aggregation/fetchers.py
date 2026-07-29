"""
Fetching + normalising external news into a single shape.

Every source — RSS feed or JSON API — is reduced to a list of :class:`FeedItem`
so the rest of the pipeline (``services.py``) doesn't care where a story came
from. Network failures raise :class:`FetchError`; the caller records that against
the source and moves on, so one dead feed never sinks a whole run.

RSS is parsed with ``feedparser`` (very tolerant of malformed feeds). JSON APIs
are called with the stdlib ``urllib`` — no extra HTTP dependency needed.

See ``teaching/40-news-aggregation/project-files/fetchers-explained.md``.
"""

from __future__ import annotations

import calendar
import html
import json
import re
import urllib.parse
import urllib.request
from dataclasses import dataclass
from datetime import UTC, datetime

import feedparser

from .sources import Source, SourceKind

# A browser-ish UA — some publishers reject the default urllib/feedparser agent.
_USER_AGENT = "FlashNewsBot/1.0 (+https://flashnews.example; news aggregator)"
_TIMEOUT = 12  # seconds — keep the admin request snappy even if a feed is slow

_TAG_RE = re.compile(r"<[^>]+>")
_IMG_RE = re.compile(r'<img[^>]+src=["\']([^"\']+)["\']', re.IGNORECASE)
_WS_RE = re.compile(r"\s+")


class FetchError(Exception):
    """Raised when a source can't be fetched (network, HTTP, or parse error)."""


@dataclass
class FeedItem:
    external_id: str
    url: str
    title: str
    summary: str = ""
    author: str = ""
    image_url: str = ""
    published_at: datetime | None = None


# ---------------------------------------------------------------------------
# Small helpers
# ---------------------------------------------------------------------------
def strip_html(value: str | None) -> str:
    if not value:
        return ""
    text = html.unescape(_TAG_RE.sub(" ", value))
    return _WS_RE.sub(" ", text).strip()


def _first_image(value: str | None) -> str:
    if not value:
        return ""
    m = _IMG_RE.search(value)
    return m.group(1) if m else ""


def _http_get(
    url: str,
    params: dict | None = None,
    data: bytes | None = None,
    extra_headers: dict | None = None,
) -> bytes:
    """HTTP GET (or POST when ``data`` is given). Raises FetchError on any error."""
    if params:
        url = f"{url}?{urllib.parse.urlencode(params)}"
    headers = {"User-Agent": _USER_AGENT, **(extra_headers or {})}
    req = urllib.request.Request(url, data=data, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=_TIMEOUT) as resp:  # noqa: S310 (trusted, curated URLs)
            return resp.read()
    except Exception as exc:  # noqa: BLE001 — normalise every network error
        raise FetchError(str(exc)) from exc


# ---------------------------------------------------------------------------
# RSS
# ---------------------------------------------------------------------------
def _rss_image(entry) -> str:
    # feedparser exposes images in several shapes depending on the feed dialect.
    media = entry.get("media_content") or entry.get("media_thumbnail")
    if media and isinstance(media, list) and media[0].get("url"):
        return media[0]["url"]
    for link in entry.get("links", []):
        if link.get("rel") == "enclosure" and str(link.get("type", "")).startswith("image"):
            return link.get("href", "")
    for key in ("summary", "description"):
        img = _first_image(entry.get(key))
        if img:
            return img
    content = entry.get("content")
    if content and isinstance(content, list):
        return _first_image(content[0].get("value"))
    return ""


def _rss_published(entry) -> datetime | None:
    parsed = entry.get("published_parsed") or entry.get("updated_parsed")
    if not parsed:
        return None
    # published_parsed is a UTC struct_time; convert to an aware datetime.
    return datetime.fromtimestamp(calendar.timegm(parsed), tz=UTC)


def fetch_rss(source: Source, max_items: int) -> list[FeedItem]:
    raw = _http_get(source.url)
    parsed = feedparser.parse(raw)
    if parsed.bozo and not parsed.entries:
        raise FetchError(f"Unparseable feed: {getattr(parsed, 'bozo_exception', 'unknown error')}")

    items: list[FeedItem] = []
    for entry in parsed.entries[:max_items]:
        link = entry.get("link", "")
        title = strip_html(entry.get("title", ""))
        if not link or not title:
            continue
        items.append(
            FeedItem(
                external_id=entry.get("id") or entry.get("guid") or link,
                url=link,
                title=title[:500],
                summary=strip_html(entry.get("summary") or entry.get("description"))[:2000],
                author=strip_html(entry.get("author", ""))[:200],
                image_url=_rss_image(entry)[:1000],
                published_at=_rss_published(entry),
            )
        )
    return items


# ---------------------------------------------------------------------------
# News sitemaps (for sites that dropped RSS but keep a Google-News sitemap)
# ---------------------------------------------------------------------------
_URL_BLOCK_RE = re.compile(r"<url>(.*?)</url>", re.S)
_LOC_RE = re.compile(r"<loc>(.*?)</loc>", re.S)
_NEWS_TITLE_RE = re.compile(r"<news:title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?</news:title>", re.S)
_NEWS_DATE_RE = re.compile(r"<news:publication_date>(.*?)</news:publication_date>", re.S)
_IMG_LOC_RE = re.compile(r"<image:loc>(.*?)</image:loc>", re.S)


def fetch_sitemap(source: Source, max_items: int) -> list[FeedItem]:
    """Parse a Google-News sitemap (`<url>` entries with `news:`/`image:` tags)."""
    raw = _http_get(source.url).decode("utf-8", "ignore")
    items: list[FeedItem] = []
    for block in _URL_BLOCK_RE.findall(raw)[:max_items]:
        loc = _LOC_RE.search(block)
        if not loc:
            continue
        url = loc.group(1).strip()
        title = _NEWS_TITLE_RE.search(block)
        date = _NEWS_DATE_RE.search(block)
        img = _IMG_LOC_RE.search(block)
        items.append(
            FeedItem(
                external_id=url,
                url=url,
                title=(strip_html(title.group(1)) if title else url)[:500],
                summary="",  # sitemaps carry no body; full text comes via extraction
                image_url=(img.group(1).strip() if img else "")[:1000],
                published_at=_parse_iso(date.group(1).strip()) if date else None,
            )
        )
    if not items:
        raise FetchError("No <url> entries found in sitemap.")
    return items


# ---------------------------------------------------------------------------
# JSON news APIs
# ---------------------------------------------------------------------------
def _parse_iso(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        dt = datetime.fromisoformat(value.replace("Z", "+00:00"))
        return dt if dt.tzinfo else dt.replace(tzinfo=UTC)
    except ValueError:
        return None


def _fetch_newsapi(source: Source, key: str, max_items: int) -> list[FeedItem]:
    data = _http_get(
        "https://newsapi.org/v2/top-headlines",
        {**source.params, "apiKey": key, "pageSize": str(max_items)},
    )
    payload = json.loads(data)
    out = []
    for a in payload.get("articles", [])[:max_items]:
        if not a.get("url") or not a.get("title"):
            continue
        out.append(
            FeedItem(
                external_id=a["url"],
                url=a["url"],
                title=a["title"][:500],
                summary=(a.get("description") or "")[:2000],
                author=(a.get("author") or (a.get("source") or {}).get("name") or "")[:200],
                image_url=(a.get("urlToImage") or "")[:1000],
                published_at=_parse_iso(a.get("publishedAt")),
            )
        )
    return out


def _fetch_gnews(source: Source, key: str, max_items: int) -> list[FeedItem]:
    data = _http_get(
        "https://gnews.io/api/v4/top-headlines",
        {**source.params, "apikey": key, "max": str(max_items)},
    )
    payload = json.loads(data)
    out = []
    for a in payload.get("articles", [])[:max_items]:
        if not a.get("url") or not a.get("title"):
            continue
        out.append(
            FeedItem(
                external_id=a["url"],
                url=a["url"],
                title=a["title"][:500],
                summary=(a.get("description") or "")[:2000],
                author=((a.get("source") or {}).get("name") or "")[:200],
                image_url=(a.get("image") or "")[:1000],
                published_at=_parse_iso(a.get("publishedAt")),
            )
        )
    return out


def _fetch_newsdata(source: Source, key: str, max_items: int) -> list[FeedItem]:
    data = _http_get("https://newsdata.io/api/1/news", {**source.params, "apikey": key})
    payload = json.loads(data)
    out = []
    for a in payload.get("results", [])[:max_items]:
        if not a.get("link") or not a.get("title"):
            continue
        creators = a.get("creator") or []
        out.append(
            FeedItem(
                external_id=a.get("article_id") or a["link"],
                url=a["link"],
                title=a["title"][:500],
                summary=(a.get("description") or "")[:2000],
                author=(", ".join(creators) if isinstance(creators, list) else str(creators))[:200],
                image_url=(a.get("image_url") or "")[:1000],
                published_at=_parse_iso(a.get("pubDate")),
            )
        )
    return out


_API_FETCHERS = {
    "newsapi": _fetch_newsapi,
    "gnews": _fetch_gnews,
    "newsdata": _fetch_newsdata,
}


def fetch_api(source: Source, max_items: int) -> list[FeedItem]:
    key = source.api_key()
    if not key:
        raise FetchError(f"No API key configured for {source.name}.")
    fetcher = _API_FETCHERS.get(source.provider)
    if not fetcher:
        raise FetchError(f"Unknown API provider: {source.provider}")
    return fetcher(source, key, max_items)


def fetch(source: Source, max_items: int) -> list[FeedItem]:
    """Dispatch to the right fetcher for the source's kind."""
    if source.kind == SourceKind.RSS:
        return fetch_rss(source, max_items)
    if source.kind == SourceKind.SITEMAP:
        return fetch_sitemap(source, max_items)
    return fetch_api(source, max_items)
