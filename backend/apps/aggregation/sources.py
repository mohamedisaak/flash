"""
The catalogue of news sources we can ingest from.

Rather than storing sources in the database, we keep a **curated, code-defined
registry** here. Feeds change rarely, and keeping them in code means they're
versioned, reviewable, and impossible to break from the UI — the admin panel
only chooses *which* of these to run.

Each :class:`Source` is one of two kinds:

- ``rss``  — a public RSS/Atom feed URL we fetch and parse (``feedparser``).
  This is the primary mechanism: legal, stable, and provided by publishers
  precisely so their headlines can be syndicated with a link back.
- ``api``  — a JSON news API (NewsAPI.org, GNews, NewsData.io). These need a
  free API key set in the environment; a provider with no key is reported as
  *unavailable* and skipped, so the stack works with zero configuration.

Regions group sources for the admin UI (Kenyan / International / Global APIs).

See ``teaching/40-news-aggregation/01-what-is-aggregation.md``.
"""

from __future__ import annotations

import os
from dataclasses import dataclass, field


class SourceKind:
    RSS = "rss"
    API = "api"
    SITEMAP = "sitemap"  # a Google-News sitemap (direct article URLs)


class SourceRegion:
    KENYA = "kenya"
    INTERNATIONAL = "international"
    GLOBAL = "global"

    CHOICES = [
        (KENYA, "Kenya"),
        (INTERNATIONAL, "International"),
        (GLOBAL, "Global (API)"),
    ]


# Environment variable that holds each API provider's key. A provider is only
# offered in the UI (and only ingested) when its key is present.
API_KEY_ENV = {
    "newsapi": "NEWSAPI_KEY",
    "gnews": "GNEWS_KEY",
    "newsdata": "NEWSDATA_KEY",
}


@dataclass(frozen=True)
class Source:
    slug: str
    name: str
    kind: str
    region: str
    url: str = ""  # RSS feed URL (kind == rss)
    provider: str = ""  # API provider key (kind == api): newsapi/gnews/newsdata
    homepage: str = ""
    # Escape hatch for a genuinely hard-paywalled source: skip extraction and use
    # the feed summary. Currently none are flagged — Nation/Standard turned out to
    # ship the full body in-page, so they extract fine.
    paywalled: bool = False
    # Optional query for API providers (e.g. country/category scoping).
    params: dict = field(default_factory=dict)

    @property
    def requires_key(self) -> bool:
        return self.kind == SourceKind.API

    def api_key(self) -> str | None:
        if self.kind != SourceKind.API:
            return None
        return os.environ.get(API_KEY_ENV.get(self.provider, ""), "") or None

    @property
    def is_available(self) -> bool:
        """RSS/sitemap are always available; API sources need their key configured."""
        if self.kind != SourceKind.API:
            return True
        return bool(self.api_key())


# ---------------------------------------------------------------------------
# The registry. Feed URLs are best-known public endpoints; a feed that moves or
# 404s fails gracefully per-source (recorded in the run report) without aborting
# the whole run, so keeping this list current is a low-risk edit.
# ---------------------------------------------------------------------------
SOURCES: list[Source] = [
    # --- Kenyan press (RSS) ---
    Source(
        "nation",
        "Nation Africa",
        SourceKind.RSS,
        SourceRegion.KENYA,
        url="https://nation.africa/kenya/rss.xml",
        homepage="https://nation.africa",
    ),
    Source(
        "standard",
        "The Standard",
        SourceKind.RSS,
        SourceRegion.KENYA,
        url="https://www.standardmedia.co.ke/rss/headlines.php",
        homepage="https://www.standardmedia.co.ke",
    ),
    # The Star dropped native RSS and exposes no public news sitemap, so we
    # discover it via a per-site Google News feed; extraction decodes each link
    # back to the real the-star.co.ke article (see google_news.py).
    Source(
        "the-star",
        "The Star",
        SourceKind.RSS,
        SourceRegion.KENYA,
        url="https://news.google.com/rss/search?q=when:7d%20site:the-star.co.ke&hl=en-KE&gl=KE&ceid=KE:en",
        homepage="https://www.the-star.co.ke",
    ),
    Source(
        "tuko",
        "Tuko",
        SourceKind.RSS,
        SourceRegion.KENYA,
        url="https://www.tuko.co.ke/rss/all.rss",
        homepage="https://www.tuko.co.ke",
    ),
    Source(
        "kenyans",
        "Kenyans.co.ke",
        SourceKind.RSS,
        SourceRegion.KENYA,
        url="https://www.kenyans.co.ke/rss.xml",
        homepage="https://www.kenyans.co.ke",
    ),
    # Citizen dropped RSS but keeps a Google-News sitemap with direct URLs.
    Source(
        "citizen",
        "Citizen Digital",
        SourceKind.SITEMAP,
        SourceRegion.KENYA,
        url="https://www.citizen.digital/sitemap-news.xml",
        homepage="https://www.citizen.digital",
    ),
    # --- International press (RSS) ---
    Source(
        "bbc",
        "BBC News",
        SourceKind.RSS,
        SourceRegion.INTERNATIONAL,
        url="http://feeds.bbci.co.uk/news/world/rss.xml",
        homepage="https://www.bbc.com/news",
    ),
    Source(
        "cnn",
        "CNN",
        SourceKind.RSS,
        SourceRegion.INTERNATIONAL,
        url="http://rss.cnn.com/rss/edition_world.rss",
        homepage="https://www.cnn.com",
    ),
    Source(
        "aljazeera",
        "Al Jazeera",
        SourceKind.RSS,
        SourceRegion.INTERNATIONAL,
        url="https://www.aljazeera.com/xml/rss/all.xml",
        homepage="https://www.aljazeera.com",
    ),
    Source(
        "guardian",
        "The Guardian",
        SourceKind.RSS,
        SourceRegion.INTERNATIONAL,
        url="https://www.theguardian.com/world/rss",
        homepage="https://www.theguardian.com",
    ),
    # --- Global news APIs (need a free key in env) ---
    Source(
        "newsapi",
        "NewsAPI.org",
        SourceKind.API,
        SourceRegion.GLOBAL,
        provider="newsapi",
        homepage="https://newsapi.org",
        params={"language": "en", "pageSize": "50"},
    ),
    Source(
        "gnews",
        "GNews",
        SourceKind.API,
        SourceRegion.GLOBAL,
        provider="gnews",
        homepage="https://gnews.io",
        params={"lang": "en", "max": "25"},
    ),
    Source(
        "newsdata",
        "NewsData.io",
        SourceKind.API,
        SourceRegion.GLOBAL,
        provider="newsdata",
        homepage="https://newsdata.io",
        params={"language": "en"},
    ),
]

BY_SLUG: dict[str, Source] = {s.slug: s for s in SOURCES}


def get(slug: str) -> Source | None:
    return BY_SLUG.get(slug)


def resolve(slugs: list[str] | None) -> list[Source]:
    """Return the requested sources (all of them if ``slugs`` is falsy)."""
    if not slugs:
        return list(SOURCES)
    return [BY_SLUG[s] for s in slugs if s in BY_SLUG]
