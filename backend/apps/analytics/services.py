"""
Analytics dashboard computations.

The raw event tables (:class:`PageView`, :class:`SearchQueryLog`) plus the ads'
running counters are turned here into the numbers the staff analytics dashboard
shows: visitors, pageviews, dwell time, traffic sources, top stories, top search
terms and ad performance. Kept out of the view so it's unit-testable and could
later be swapped to read from the :class:`DailyStat` rollup for scale.

Visitor/traffic metrics respect the requested time window; ad impression/click
counters are lifetime totals on the ad rows (there's no per-event ad log), so
they're reported as lifetime figures.

See ``teaching/41-analytics-dashboard/``.
"""

from __future__ import annotations

from datetime import timedelta

from django.db.models import Avg, Count, Sum
from django.db.models.functions import TruncDate
from django.utils import timezone

from apps.accounts.models import Role, User
from apps.ads.models import Advertisement
from apps.articles.models import Article, ArticleStatus
from apps.newsletters.models import NewsletterSubscriber

from .models import PageView, SearchQueryLog

# Path prefix of a public article page (see web app route /articles/[slug]).
_ARTICLE_PREFIX = "/articles/"


def _ctr(clicks: int, impressions: int) -> float:
    """Click-through rate as a fraction, guarding divide-by-zero."""
    return round(clicks / impressions, 4) if impressions else 0.0


def _timeseries(views_qs, since, until) -> list[dict]:
    """Per-day pageviews + unique visitors, with zero-filled gaps."""
    rows = (
        views_qs.annotate(day=TruncDate("created_at"))
        .values("day")
        .annotate(pageviews=Count("id"), visitors=Count("session_key", distinct=True))
    )
    by_day = {r["day"]: r for r in rows}
    series = []
    day = since.date()
    last = until.date()
    while day <= last:
        r = by_day.get(day)
        series.append(
            {
                "date": day.isoformat(),
                "pageviews": r["pageviews"] if r else 0,
                "visitors": r["visitors"] if r else 0,
            }
        )
        day += timedelta(days=1)
    return series


def _top_articles(views_qs, limit: int = 10) -> list[dict]:
    """Most-viewed article pages in the window, resolved to titles via slug."""
    rows = (
        views_qs.filter(path__startswith=_ARTICLE_PREFIX)
        .values("path")
        .annotate(views=Count("id"), visitors=Count("session_key", distinct=True))
        .order_by("-views")[:limit]
    )
    # Resolve slugs -> titles in one query rather than N.
    slugs = [r["path"][len(_ARTICLE_PREFIX) :].strip("/") for r in rows]
    titles = dict(Article.objects.filter(slug__in=slugs).values_list("slug", "title"))
    out = []
    for r in rows:
        slug = r["path"][len(_ARTICLE_PREFIX) :].strip("/")
        out.append(
            {
                "slug": slug,
                "title": titles.get(slug, slug or "(home)"),
                "path": r["path"],
                "views": r["views"],
                "visitors": r["visitors"],
            }
        )
    return out


def _top_searches(since, limit: int = 10) -> list[dict]:
    rows = (
        SearchQueryLog.objects.filter(created_at__gte=since)
        .values("query")
        .annotate(count=Count("id"), avg_results=Avg("results_count"))
        .order_by("-count")[:limit]
    )
    return [
        {"query": r["query"], "count": r["count"], "avg_results": round(r["avg_results"] or 0, 1)}
        for r in rows
    ]


def _sources(views_qs) -> list[dict]:
    rows = views_qs.values("source").annotate(count=Count("id")).order_by("-count")
    return [{"source": r["source"] or "direct", "count": r["count"]} for r in rows]


def _ads() -> dict:
    ads = list(Advertisement.objects.all())
    totals = Advertisement.objects.aggregate(impressions=Sum("impressions"), clicks=Sum("clicks"))
    imp = totals["impressions"] or 0
    clk = totals["clicks"] or 0

    by_ad = [
        {
            "id": a.id,
            "name": a.name,
            "placement": a.placement,
            "is_active": a.is_active,
            "impressions": a.impressions,
            "clicks": a.clicks,
            "ctr": _ctr(a.clicks, a.impressions),
        }
        for a in sorted(ads, key=lambda a: (a.clicks, a.impressions), reverse=True)
    ]

    placements: dict[str, dict] = {}
    for a in ads:
        p = placements.setdefault(
            a.placement, {"placement": a.placement, "impressions": 0, "clicks": 0}
        )
        p["impressions"] += a.impressions
        p["clicks"] += a.clicks
    by_placement = sorted(placements.values(), key=lambda p: p["impressions"], reverse=True)
    for p in by_placement:
        p["ctr"] = _ctr(p["clicks"], p["impressions"])

    return {
        "impressions": imp,
        "clicks": clk,
        "ctr": _ctr(clk, imp),
        "by_ad": by_ad,
        "by_placement": by_placement,
    }


def dashboard_summary(days: int = 30) -> dict:
    """Assemble the full analytics payload for the staff dashboard."""
    until = timezone.now()
    since = until - timedelta(days=days - 1)  # inclusive of today
    since = since.replace(hour=0, minute=0, second=0, microsecond=0)

    views = PageView.objects.filter(created_at__gte=since)
    agg = views.aggregate(
        pageviews=Count("id"),
        visitors=Count("session_key", distinct=True),
        avg_read=Avg("read_seconds"),
    )

    ads = _ads()
    return {
        "range_days": days,
        "since": since.date().isoformat(),
        "until": until.date().isoformat(),
        "totals": {
            "pageviews": agg["pageviews"],
            "visitors": agg["visitors"],
            "avg_read_seconds": int(agg["avg_read"] or 0),
            "ad_impressions": ads["impressions"],
            "ad_clicks": ads["clicks"],
            "ad_ctr": ads["ctr"],
            "articles_published": Article.objects.filter(status=ArticleStatus.PUBLISHED).count(),
            "articles_total": Article.objects.count(),
            "subscribers": NewsletterSubscriber.objects.filter(is_active=True).count(),
            "authors": User.objects.filter(role__in=[Role.AUTHOR, Role.JOURNALIST]).count(),
        },
        "timeseries": _timeseries(views, since, until),
        "sources": _sources(views),
        "top_articles": _top_articles(views),
        "top_searches": _top_searches(since),
        "ads": ads,
    }
