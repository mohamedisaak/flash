"""
The synthesis engine: gather → generate → sanitise → draft.

:func:`synthesize` is the one entry point. Given a set of aggregated item ids it:

1. Loads the items and makes sure each has a body (fetching full content on
   demand, best-effort — a gated source falls back to its summary).
2. Builds the grounded prompt (see :mod:`.prompts`) and calls the configured
   model (see :mod:`.providers`).
3. Parses the model's JSON, **sanitises** the HTML (never trust model output),
   and appends a transparent **Sources** block with outbound credit links.
4. Creates a **draft** :class:`~apps.articles.models.Article` — never auto-
   published; a human reviews it. Records everything on a :class:`SynthesisJob`.

Why draft-only, self-canonical, sources-kept: those three choices are what make
this safe for search ranking and copyright. The reasoning lives in
``teaching/41-ai-synthesis/00-why-synthesis-not-paraphrase.md``.

Kept out of the view so it is unit-testable (with a fake provider) and reusable
from a Celery task.

See ``teaching/41-ai-synthesis/project-files/services-explained.md``.
"""

from __future__ import annotations

import html
import json
import logging
import re
import time

import nh3
from django.db import transaction
from django.utils import timezone

from apps.aggregation.models import AggregatedArticle

# Reuse the aggregation helpers rather than duplicate them: the same slug,
# category, image and content-extraction logic should behave identically whether
# an item is imported verbatim or synthesised.
from apps.aggregation.services import (
    _download_image,
    _resolve_category,
    _unique_slug,
    fetch_full_content,
)
from apps.articles.models import Article, ArticleStatus

from . import prompts
from .models import SynthesisJob, SynthesisStatus
from .providers import LLMError, get_provider

logger = logging.getLogger(__name__)

# The HTML we allow through from the model. Deliberately tiny — a news body needs
# no <script>, <iframe>, inline styles or event handlers, so nh3 strips anything
# outside this set (defence against prompt-injected markup).
_ALLOWED_TAGS = {"p", "h2", "h3", "ul", "ol", "li", "blockquote", "strong", "em", "a", "br"}
_ALLOWED_ATTRS = {"a": {"href", "title"}}


class SynthesisError(RuntimeError):
    """A synthesis attempt failed in a way worth showing the editor."""


# ---------------------------------------------------------------------------
# Gathering source material
# ---------------------------------------------------------------------------
def _gather_sources(ids: list[int]) -> tuple[list[AggregatedArticle], list[dict]]:
    """Load the chosen items (in the given order) and shape them for the prompt.

    Items missing a body get one fetched on demand (best-effort); gated pages
    fall back to their feed summary. Returns the ORM rows (for provenance) and
    the plain dicts the prompt builder consumes.
    """
    rows = list(AggregatedArticle.objects.filter(id__in=ids))
    if not rows:
        raise SynthesisError("None of the selected items exist.")
    # Preserve the caller's ordering (the DB doesn't guarantee it).
    by_id = {r.id: r for r in rows}
    rows = [by_id[i] for i in ids if i in by_id]

    payload: list[dict] = []
    for row in rows:
        if not row.content and not row.content_fetched:
            try:
                fetch_full_content(row)  # populates row.content in place
            except Exception:  # noqa: BLE001 — a failed fetch just means "use summary"
                logger.warning("synthesis: content fetch failed for agg #%s", row.id)
        body = _strip_html(row.content) if row.content else row.summary
        payload.append(
            {
                "name": row.source_name,
                "title": row.title,
                "url": row.url,
                "summary": row.summary,
                "body": body,
            }
        )
    return rows, payload


def _strip_html(markup: str) -> str:
    """Reduce extracted article HTML to plain text for the prompt.

    The model reasons over facts, not markup; sending clean text keeps the
    prompt smaller and stops stray tags from leaking into the output.
    """
    text = re.sub(r"<(script|style)[^>]*>.*?</\1>", " ", markup, flags=re.S | re.I)
    text = re.sub(r"<[^>]+>", " ", text)
    text = html.unescape(text)
    return re.sub(r"\s+", " ", text).strip()


# ---------------------------------------------------------------------------
# Parsing + sanitising the model output
# ---------------------------------------------------------------------------
def _parse_output(text: str) -> dict:
    """Turn the model's reply into the expected dict, tolerantly.

    Instruction-tuned models mostly return clean JSON, but some wrap it in
    ```json fences or add a stray sentence. We strip fences, then fall back to
    the outermost ``{...}`` slice before giving up.

    ``strict=False`` lets ``json.loads`` accept literal control characters (raw
    newlines/tabs) inside string values — common now that ``body_html`` is a
    long, multi-line block — instead of rejecting them with "Invalid control
    character".
    """
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
        cleaned = re.sub(r"\s*```$", "", cleaned).strip()
    try:
        data = json.loads(cleaned, strict=False)
    except json.JSONDecodeError:
        start, end = cleaned.find("{"), cleaned.rfind("}")
        if start == -1 or end <= start:
            raise SynthesisError("The model did not return parseable JSON.") from None
        try:
            data = json.loads(cleaned[start : end + 1], strict=False)
        except json.JSONDecodeError as exc:
            raise SynthesisError(f"The model returned malformed JSON: {exc}") from exc

    if not isinstance(data, dict) or not data.get("title") or not data.get("body_html"):
        raise SynthesisError("The model output is missing a title or body.")
    return data


def _citations_html(rows: list[AggregatedArticle]) -> str:
    """Build the transparent 'Sources' block appended to every synthesised piece.

    This is the deliberate opposite of hiding provenance: outbound, credited
    links to the outlets whose reporting we synthesised. Genuine editorial
    citations are followed links (a trust signal), secured with ``noopener``.
    """
    items = []
    seen = set()
    for row in rows:
        key = (row.source_name, row.url)
        if key in seen:
            continue
        seen.add(key)
        name = html.escape(row.source_name or "Source")
        title = html.escape(row.title or "report")
        url = html.escape(row.url, quote=True)
        items.append(
            f'<li><a href="{url}" target="_blank" rel="noopener">{name} — {title}</a></li>'
        )
    return (
        "<h2>Sources</h2>\n"
        "<p>This report was synthesised from the following coverage:</p>\n"
        f"<ul>{''.join(items)}</ul>"
    )


def _build_content(data: dict, rows: list[AggregatedArticle]) -> str:
    """Sanitise the model body and append the citations block."""
    body = nh3.clean(
        data.get("body_html", ""),
        tags=_ALLOWED_TAGS,
        attributes=_ALLOWED_ATTRS,
    )
    return f"{body}\n\n{_citations_html(rows)}"


# ---------------------------------------------------------------------------
# The public entry point
# ---------------------------------------------------------------------------
def synthesize(
    ids: list[int],
    user,
    *,
    angle: str = "",
    category_slug: str | None = None,
) -> SynthesisJob:
    """Synthesise one original draft article from the selected aggregated items.

    Always creates a ``SynthesisJob`` (even on failure, so the error is
    recorded) and, on success, a ``draft`` Article linked back to its sources.
    Raises :class:`SynthesisError` / :class:`LLMError` on failure after the job
    row is marked ``error`` — the view turns that into a clean API response.

    Deliberately NOT wrapped in a single ``transaction.atomic``: the job row and
    its ``error`` update must survive a model failure, so they live outside any
    transaction. Only the draft-creation step (:func:`_create_draft`) is atomic,
    so the Article and its source back-links commit together or not at all.
    """
    if not ids:
        raise SynthesisError("Select at least one item to synthesise.")

    job = SynthesisJob.objects.create(
        angle=angle[:300],
        category_slug=(category_slug or "")[:80],
        status=SynthesisStatus.RUNNING,
        created_by=user if getattr(user, "is_authenticated", False) else None,
    )
    rows, payload = _gather_sources(ids)
    job.sources.set(rows)

    provider = get_provider()
    started = time.monotonic()
    try:
        result = provider.generate(
            system=prompts.SYSTEM_PROMPT,
            prompt=prompts.build_user_prompt(payload, angle=angle),
        )
        data = _parse_output(result.text)
        article = _create_draft(data, rows, user, category_slug)
    except (LLMError, SynthesisError) as exc:
        job.status = SynthesisStatus.ERROR
        job.error = str(exc)[:2000]
        job.duration_ms = int((time.monotonic() - started) * 1000)
        job.save(update_fields=["status", "error", "duration_ms", "updated_at"])
        raise

    job.status = SynthesisStatus.SUCCESS
    job.provider = result.provider
    job.model = result.model
    job.prompt_tokens = result.prompt_tokens
    job.completion_tokens = result.completion_tokens
    job.duration_ms = int((time.monotonic() - started) * 1000)
    job.article = article
    job.save()
    return job


@transaction.atomic
def _create_draft(data: dict, rows: list[AggregatedArticle], user, category_slug) -> Article:
    """Persist the synthesised draft and wire up provenance (atomically)."""
    title = str(data["title"]).strip()[:255]
    content_html = _build_content(data, rows)
    words = len(_strip_html(content_html).split())
    # Credit line: the distinct outlets we synthesised, preserving order.
    credit = ", ".join(dict.fromkeys(r.source_name for r in rows if r.source_name))

    article = Article(
        title=title,
        slug=_unique_slug(title),
        excerpt=str(data.get("excerpt", "")).strip()[:500],
        content=content_html,
        author=user,
        # Explicit choice wins; else auto-file into the section the sources were
        # crawled for (first tagged source); else the default section.
        category=_resolve_category(
            category_slug or next((r.category for r in rows if r.category), "")
        ),
        source=f"Synthesised from {credit}"[:255] if credit else "",
        status=ArticleStatus.DRAFT,  # never auto-publish — a human reviews first
        published_at=None,
        reading_time=max(1, words // 200),
        meta_description=str(data.get("meta_description", "")).strip()[:160],
        # canonical_url left blank → the piece is canonical to itself (it is
        # original), so there is no duplicate-content signal to search engines.
    )
    article.save()

    # Best-effort lead image from the first source that has one.
    for row in rows:
        if row.image_url:
            _download_image(article, row.image_url)
            break

    # Mark each source as consumed so the ingestion UI shows it, and link the
    # aggregated rows to the resulting article for provenance.
    now = timezone.now()
    for row in rows:
        if not row.imported_article_id:
            row.imported_article = article
            row.imported_at = now
            row.save(update_fields=["imported_article", "imported_at", "updated_at"])
    return article
