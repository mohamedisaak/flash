"""
On-demand frontend revalidation.

When editorial staff change CMS content (a FAQ answer, a static page, the site
settings), the public site is still serving a cached copy — Next.js caches those
pages for their ISR window. Rather than wait that window out, the backend tells
the frontend to drop just the affected cache tags, so the edit shows up within a
second.

:func:`trigger_revalidate` POSTs the changed tags to the Next.js
``/api/revalidate`` route, authenticated with a shared secret. It is **best
effort**: any failure (frontend down, secret unset, network blip) is logged and
swallowed — revalidation must never break the admin save that triggered it. When
the secret or site URL isn't configured (e.g. local dev) it is a no-op, and edits
simply appear on the normal ISR timer instead.

Dependency-free HTTP via the stdlib, matching the rest of the codebase.

See ``web/src/app/api/revalidate/route.ts`` (the receiver) and
``apps/cms/signals.py`` (the callers).
"""

from __future__ import annotations

import json
import logging
import urllib.error
import urllib.request

from django.conf import settings

logger = logging.getLogger(__name__)


def trigger_revalidate(tags: list[str] | None = None, paths: list[str] | None = None) -> None:
    """Ask the frontend to revalidate the given cache tags/paths (best effort)."""
    secret = getattr(settings, "REVALIDATE_SECRET", "")
    base = (getattr(settings, "SITE_URL", "") or "").rstrip("/")
    if not secret or not base:
        return  # not configured — rely on the normal ISR timer

    url = f"{base}/api/revalidate"
    data = json.dumps({"tags": list(tags or []), "paths": list(paths or [])}).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data,
        method="POST",
        headers={"Content-Type": "application/json", "x-revalidate-secret": secret},
    )
    try:
        with urllib.request.urlopen(req, timeout=5) as resp:  # noqa: S310 — configured URL
            resp.read()
    except (urllib.error.URLError, TimeoutError, OSError) as exc:
        logger.warning("revalidate: could not reach frontend at %s (%s)", url, exc)
