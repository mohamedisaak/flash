"""
Analytics rollup tasks.

``aggregate_daily_analytics`` turns the raw, high-volume ``PageView`` events into
one compact ``DailyStat`` row per day. The dashboard then reads those summaries
instead of scanning millions of raw rows. Run nightly by Celery beat; safe to
re-run (it upserts). See ``teaching/09-celery/05-periodic-tasks.md`` and
``teaching/30-database-design/analytics-tables.md``.
"""

import logging

from celery import shared_task
from django.db.models import Avg, Count
from django.db.models.functions import TruncDate

from .models import DailyStat, PageView

logger = logging.getLogger(__name__)


@shared_task
def aggregate_daily_analytics() -> int:
    """(Re)build DailyStat rows from PageView events. Returns days processed."""
    rows = (
        PageView.objects.annotate(day=TruncDate("created_at"))
        .values("day")
        .annotate(
            pageviews=Count("id"),
            unique_sessions=Count("session_key", distinct=True),
            avg_read=Avg("read_seconds"),
        )
    )
    processed = 0
    for row in rows:
        DailyStat.objects.update_or_create(
            date=row["day"],
            defaults={
                "pageviews": row["pageviews"],
                "unique_sessions": row["unique_sessions"],
                "avg_read_seconds": int(row["avg_read"] or 0),
            },
        )
        processed += 1
    logger.info("aggregate_daily_analytics: processed %d day(s)", processed)
    return processed
