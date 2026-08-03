"""
Prompt engineering for *original* multi-source synthesis.

This module is the heart of the "won't get you deindexed" promise. The whole
difference between safe aggregation and spam is **what we ask the model to do**:

- ❌ "Reword this article and remove mentions of the source" → produces a
  near-duplicate of someone else's copyrighted work with the fingerprints filed
  off. Google's spam policies call this *scraped / spun content* and demote or
  deindex it; it is also a copyright problem.
- ✅ "Here are facts reported by several outlets. Write a NEW, original article
  in our own voice that reports those facts, and cite the outlets." → produces
  genuine journalism-style synthesis. Original expression, transparent sourcing,
  outbound credit links — all *positive* signals.

So the prompt below is strict about four things: write original prose (never
paraphrase one source sentence-by-sentence), stay grounded in the supplied
facts (no invention), attribute claims, and return a small **JSON** object we
can parse deterministically. Asking for JSON (rather than free text we regex)
keeps the service code simple and the output predictable.

See ``teaching/41-ai-synthesis/02-prompt-design-for-citation.md``.
"""

from __future__ import annotations

import json

SYSTEM_PROMPT = (
    "You are a senior staff writer and editor at an independent news outlet. "
    "You write clear, neutral, original news copy in your own words. You are given "
    "facts already reported by other outlets and you synthesise them into a single "
    "fresh article for your publication.\n\n"
    "Hard rules:\n"
    "1. Write ORIGINAL prose. Never copy or lightly reword sentences from the "
    "source material — express the facts anew, in a plain house style.\n"
    "2. Stay strictly grounded in the supplied facts. Do NOT invent quotes, "
    "numbers, names, dates, or events. If sources disagree, note the disagreement "
    "and attribute each claim.\n"
    "3. Attribute non-obvious or contested claims in-text (e.g. 'according to "
    "Reuters'). Do not pretend the reporting is your own eyewitness account.\n"
    "4. Neutral, factual tone. No editorialising, no clickbait, no invented "
    "urgency.\n"
    "5. Return ONLY a single JSON object in the exact schema requested — no "
    "markdown fences, no commentary before or after."
)

# The JSON contract we ask the model to fill. Documented here so the parser and
# the prompt can never drift apart.
_OUTPUT_SCHEMA = {
    "title": "string — an original headline, max 120 chars, not copied from a source",
    "excerpt": "string — a 1–2 sentence standfirst/summary, max 300 chars",
    "body_html": (
        "string — the article body as simple, valid HTML using only <p>, <h2>, "
        "<ul>, <li>, <blockquote>, <strong>, <em> tags. 3–8 paragraphs. Do NOT "
        "include a sources/credits list — that is added separately."
    ),
    "meta_description": "string — a search-result snippet, max 155 chars",
}


def build_user_prompt(sources: list[dict], *, angle: str = "") -> str:
    """Assemble the user message from the selected source articles.

    ``sources`` is a list of ``{name, title, url, summary, body}`` dicts — one
    per aggregated item chosen by the editor. We label each with an index the
    model can refer to, cap each body so a few long articles can't blow the
    context window, and (optionally) steer the framing with ``angle``.
    """
    blocks: list[str] = []
    for i, src in enumerate(sources, start=1):
        body = (src.get("body") or src.get("summary") or "").strip()
        if len(body) > 6000:  # keep the prompt within a sane context budget
            body = body[:6000] + " …[truncated]"
        blocks.append(
            f"### SOURCE {i}: {src.get('name', 'Unknown outlet')}\n"
            f"Headline: {src.get('title', '').strip()}\n"
            f"URL: {src.get('url', '').strip()}\n"
            f"Reported content:\n{body or '(no body available — use the headline only)'}"
        )

    steer = f"\nEditor's angle for this piece: {angle.strip()}\n" if angle.strip() else ""
    schema = json.dumps(_OUTPUT_SCHEMA, indent=2)
    n = len(sources)
    plural = "these reports" if n > 1 else "this report"

    return (
        f"You have {n} source report(s) below. Synthesise {plural} into ONE "
        "original news article for our outlet, following every rule in your "
        "instructions.\n"
        f"{steer}"
        "\nReturn a JSON object with exactly these fields:\n"
        f"{schema}\n\n"
        "=== SOURCE MATERIAL ===\n\n" + "\n\n".join(blocks)
    )
