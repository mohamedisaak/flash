"""
Make the Celery app import when Django starts.

This ensures the ``@shared_task`` decorator uses our configured Celery app, and
that ``config.celery.app`` is ready whenever Django is. See
``teaching/09-celery/02-project-setup.md``.
"""

from .celery import app as celery_app

__all__ = ("celery_app",)
