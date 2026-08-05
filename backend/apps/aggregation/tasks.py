"""
Optional background ingestion.

Ingestion is admin-triggered by default (the run endpoint executes synchronously
so the panel shows an immediate report). This task exists so a newsroom *can*
also schedule periodic pulls via Celery beat if they want to — add an entry to
``CELERY_BEAT_SCHEDULE`` pointing at ``run_scheduled_ingestion``. It is not
scheduled by default.

See ``teaching/09-celery/05-periodic-tasks.md``.
"""

import logging

from celery import shared_task

from .services import run_ingestion

logger = logging.getLogger(__name__)


@shared_task
def run_scheduled_ingestion(sources=None, categories=None, max_items: int = 25) -> dict:
    """Run ingestion in the background (no user attribution)."""
    summary = run_ingestion(
        slugs=sources, categories=categories, max_items=max_items, dry_run=False, user=None
    )
    logger.info(
        "run_scheduled_ingestion: +%d new, ~%d updated across %d source(s)",
        summary["created"],
        summary["updated"],
        len(summary["sources"]),
    )
    return summary
