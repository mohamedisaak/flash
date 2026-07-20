"""
Celery tasks for the media library.

Tasks are the *background* entry points. They stay thin — validation + calling
the service — so the heavy logic in ``services.py`` remains easy to test on its
own. Decorated with ``@shared_task`` so they attach to whatever Celery app is
configured (ours, in config/celery.py).

Trigger from anywhere with ``.delay(...)``:
    from apps.media.tasks import generate_image_renditions
    generate_image_renditions.delay(article.featured_image.name)

See ``teaching/09-celery/03-image-pipeline.md``.
"""

import logging

from celery import shared_task

from .services import generate_renditions

logger = logging.getLogger(__name__)


@shared_task(
    bind=True,
    autoretry_for=(OSError,),  # transient storage/IO hiccups → retry
    retry_backoff=True,
    max_retries=3,
)
def generate_image_renditions(self, source_path: str) -> int:
    """Generate responsive renditions for one uploaded image.

    Returns the number of rendition files produced (for logging/monitoring).
    """
    renditions = generate_renditions(source_path)
    logger.info("Generated %d renditions for %s", len(renditions), source_path)
    return len(renditions)
