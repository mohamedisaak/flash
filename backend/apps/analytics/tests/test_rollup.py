"""Tests for the daily analytics rollup task."""

import pytest

from apps.analytics.models import DailyStat, PageView
from apps.analytics.tasks import aggregate_daily_analytics

pytestmark = pytest.mark.django_db


def test_rollup_summarizes_pageviews():
    # Three views today across two sessions.
    PageView.objects.create(path="/a", session_key="s1", read_seconds=10)
    PageView.objects.create(path="/b", session_key="s1", read_seconds=20)
    PageView.objects.create(path="/c", session_key="s2", read_seconds=30)

    days = aggregate_daily_analytics()

    assert days == 1
    stat = DailyStat.objects.get()
    assert stat.pageviews == 3
    assert stat.unique_sessions == 2
    assert stat.avg_read_seconds == 20  # (10+20+30)/3


def test_rollup_is_idempotent():
    PageView.objects.create(path="/a", session_key="s1", read_seconds=5)
    aggregate_daily_analytics()
    aggregate_daily_analytics()  # second run must not duplicate the day
    assert DailyStat.objects.count() == 1
