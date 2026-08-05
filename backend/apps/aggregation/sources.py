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
import urllib.parse
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
    # Business Daily (Nation Media's business title). Whole-site RSS is
    # business-heavy; also crawlable by category (see CATEGORY support below).
    Source(
        "business-daily",
        "Business Daily",
        SourceKind.RSS,
        SourceRegion.KENYA,
        url="https://www.businessdailyafrica.com/bd/rss.xml",
        homepage="https://www.businessdailyafrica.com",
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


# ---------------------------------------------------------------------------
# Category-scoped crawling (Kenyan sources)
# ---------------------------------------------------------------------------
# Crawl a single section (Sports, Business, …) from the Kenyan press instead of
# the whole site. Two mechanisms, resolved per (source, category):
#
# - Native section RSS where the publisher exposes one (Standard, Tuko, Business
#   Daily) — richest and most reliable.
# - Otherwise a Google-News site search scoped to the publisher's domain and the
#   category's keywords — uniform, works for every source (same trick The Star's
#   base feed already uses; the URLs it yields are decoded back to the real
#   article at extraction time, see ``extract.py``).
#
# Items ingested this way are tagged with the category so importing/synthesising
# them files the post into the matching editorial section automatically.


@dataclass(frozen=True)
class NewsCategory:
    slug: str  # editorial section slug the item is filed under, e.g. "sports"
    label: str  # human label for the admin UI
    query: str  # Google-News search terms (OR-joined) for the fallback feed


CATEGORIES: list[NewsCategory] = [
    NewsCategory("sports", "Sports", "sports OR football OR athletics OR rugby"),
    NewsCategory("politics", "Politics", "politics OR parliament OR government OR president"),
    NewsCategory("business", "Business", "business OR economy OR markets OR finance"),
    NewsCategory("entertainment", "Entertainment", "entertainment OR music OR celebrity OR film"),
    NewsCategory("health-lifestyle", "Health & Lifestyle", "health OR lifestyle OR wellness OR fitness"),
    NewsCategory("technology", "Technology", "technology OR tech OR digital OR startup"),
    NewsCategory("counties", "Counties", "county OR counties OR devolution OR governor"),
]
CATEGORY_BY_SLUG: dict[str, NewsCategory] = {c.slug: c for c in CATEGORIES}

# Publisher domain used to scope the Google-News fallback feed. Only Kenyan
# sources listed here support category crawling.
GNEWS_DOMAIN: dict[str, str] = {
    "nation": "nation.africa",
    "standard": "standardmedia.co.ke",
    "the-star": "the-star.co.ke",
    "tuko": "tuko.co.ke",
    "kenyans": "kenyans.co.ke",
    "citizen": "citizen.digital",
    "business-daily": "businessdailyafrica.com",
}

# Verified native per-section feeds, preferred over the Google-News fallback.
# {source_slug: {category_slug: feed_url}}
NATIVE_CATEGORY_FEEDS: dict[str, dict[str, str]] = {
    "standard": {
        "business": "https://www.standardmedia.co.ke/rss/business.php",
        "politics": "https://www.standardmedia.co.ke/rss/politics.php",
        "sports": "https://www.standardmedia.co.ke/rss/sports.php",
        "entertainment": "https://www.standardmedia.co.ke/rss/entertainment.php",
    },
    "tuko": {
        "politics": "https://www.tuko.co.ke/rss/politics.rss",
        "sports": "https://www.tuko.co.ke/rss/sports.rss",
        "entertainment": "https://www.tuko.co.ke/rss/entertainment.rss",
        "technology": "https://www.tuko.co.ke/rss/technology.rss",
    },
    "business-daily": {
        "business": "https://www.businessdailyafrica.com/bd/rss.xml",
    },
}


def category_crawl_sources() -> list[Source]:
    """The Kenyan sources that can be crawled by category."""
    return [s for s in SOURCES if s.slug in GNEWS_DOMAIN]


def _gnews_feed(domain: str, category: NewsCategory) -> str:
    q = f"when:7d site:{domain} ({category.query})"
    return (
        "https://news.google.com/rss/search?q="
        + urllib.parse.quote(q)
        + "&hl=en-KE&gl=KE&ceid=KE:en"
    )


def category_feed_source(base_slug: str, category_slug: str) -> Source | None:
    """A synthetic :class:`Source` that fetches ``category`` from ``base_slug``.

    Prefers a native section feed; otherwise a Google-News site search. Keeps the
    base publisher's slug/name (so items stay attributed to it) and is RSS-kind
    (both feed types parse as RSS). Returns None if the source/category can't be
    category-crawled.
    """
    base = BY_SLUG.get(base_slug)
    category = CATEGORY_BY_SLUG.get(category_slug)
    domain = GNEWS_DOMAIN.get(base_slug)
    if not base or not category or not domain:
        return None
    url = NATIVE_CATEGORY_FEEDS.get(base_slug, {}).get(category_slug) or _gnews_feed(
        domain, category
    )
    return Source(
        slug=base.slug,
        name=base.name,
        kind=SourceKind.RSS,
        region=base.region,
        url=url,
        homepage=base.homepage,
        paywalled=base.paywalled,
    )
