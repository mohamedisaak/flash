"""
CMS → frontend cache invalidation.

When a piece of CMS content changes, purge the matching Next.js cache tag so the
public site reflects the edit immediately. The tags here must match the ones the
frontend attaches to its fetches (see ``web/src/lib/api.ts``):

- ``cms:faqs``     — the /faq page
- ``cms:pages``    — the /pages/<key> static pages (About, Contact, …)
- ``cms:settings`` — the footer (site name, about blurb, contact details)

We fire on ``transaction.on_commit`` so the POST goes out only after the row is
actually committed — otherwise the frontend could re-fetch and read the *old*
value before our transaction lands. Revalidation itself is best-effort (see
:func:`apps.common.revalidate.trigger_revalidate`).
"""

from django.db import transaction
from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from apps.common.revalidate import trigger_revalidate

from .models import FAQ, SiteSetting, StaticPage


def _revalidate(tags: list[str]) -> None:
    transaction.on_commit(lambda: trigger_revalidate(tags))


@receiver(post_save, sender=FAQ)
@receiver(post_delete, sender=FAQ)
def _faq_changed(**kwargs) -> None:
    _revalidate(["cms:faqs"])


@receiver(post_save, sender=StaticPage)
@receiver(post_delete, sender=StaticPage)
def _page_changed(**kwargs) -> None:
    _revalidate(["cms:pages"])


@receiver(post_save, sender=SiteSetting)
def _settings_changed(**kwargs) -> None:
    _revalidate(["cms:settings"])
