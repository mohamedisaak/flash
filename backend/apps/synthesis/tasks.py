"""
Optional background synthesis.

The API runs synthesis synchronously so a single-VPS deployment works without a
Celery worker. This task lets a newsroom offload it instead (e.g. batch-
synthesising overnight) — call ``synthesize_task.delay(ids, user_id, ...)`` from
your own scheduling code. Not scheduled by default.

See ``teaching/09-celery/`` and ``teaching/41-ai-synthesis/``.
"""

import logging

from celery import shared_task
from django.contrib.auth import get_user_model

from . import services

logger = logging.getLogger(__name__)


@shared_task
def synthesize_task(ids, user_id=None, angle: str = "", category_slug: str | None = None) -> int:
    """Run synthesis in the background. Returns the created job id."""
    user = None
    if user_id:
        user = get_user_model().objects.filter(pk=user_id).first()
    job = services.synthesize(ids, user, angle=angle, category_slug=category_slug)
    logger.info("synthesize_task: job #%s status=%s", job.id, job.status)
    return job.id
