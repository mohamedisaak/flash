"""
Celery application for the Flash platform.

Celery runs work *outside* the web request — image resizing, video transcoding,
sending notifications, scheduled publishing — so the API stays fast. This module
creates the Celery app, points it at our Django settings, and auto-discovers a
``tasks.py`` in every installed app.

See ``teaching/09-celery/`` for the full explanation.
"""

import os

from celery import Celery

# Celery needs to know where Django's settings live before it imports anything.
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

app = Celery("flash")

# Read Celery config from Django settings, using the CELERY_ prefix
# (e.g. CELERY_BROKER_URL -> broker_url).
app.config_from_object("django.conf:settings", namespace="CELERY")

# Find @shared_task-decorated functions in each app's tasks.py automatically.
app.autodiscover_tasks()


@app.task(bind=True, ignore_result=True)
def debug_task(self):
    """A trivial task to confirm the worker is wired up: ``debug_task.delay()``."""
    print(f"Request: {self.request!r}")
