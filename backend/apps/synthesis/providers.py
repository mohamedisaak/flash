"""
The LLM provider layer — a thin, swappable interface over "generate text".

Synthesis needs exactly one capability from a model: *given a system prompt and
a user prompt, return the completion*. Everything else (which model, hosted where,
paid or free) is a deployment detail. So we hide it behind :class:`LLMProvider`
and pick the concrete one from settings at call time.

Three providers ship:

- :class:`OllamaProvider` — talks to a **local Ollama server on your own VPS**
  (``http://localhost:11434`` by default). The model weights live on your disk;
  no data leaves the box and there is no per-token cost. This is the default.
- :class:`GroqProvider` — an OpenAI-compatible hosted API with a free tier. A
  drop-in fallback for when the VPS is too small to run a model locally. Only the
  ``AI_PROVIDER`` env var changes; nothing else in the codebase does.
- :class:`DisabledProvider` — returned when no provider is configured, so the
  feature degrades to a clear error instead of a crash.

Deliberately dependency-free: we speak HTTP with the standard library
(``urllib.request``), the same choice the aggregation fetchers made. Adding a
heavy SDK for one POST request would not earn its keep.

See ``teaching/41-ai-synthesis/project-files/providers-explained.md``.
"""

from __future__ import annotations

import json
import logging
import re
import time
import urllib.error
import urllib.request
from dataclasses import dataclass
from typing import Protocol

from django.conf import settings

logger = logging.getLogger(__name__)

# Longest we'll sleep-and-retry when a hosted API rate-limits us (seconds). Keeps
# the synchronous request well within AI_SYNTHESIS_TIMEOUT.
_MAX_RETRY_WAIT = 25


class LLMError(RuntimeError):
    """Raised when a provider cannot produce a completion.

    The message is safe to surface to staff in the admin (it explains *why* —
    connection refused, timeout, model not pulled — so they can fix the cause).
    """


# Hosted APIs (Groq) sit behind Cloudflare, which bans the stdlib's default
# ``Python-urllib/x.y`` User-Agent outright (HTTP 403, Cloudflare error 1010 —
# "banned browser signature"). Sending an explicit, browser-like UA gets us past
# that bot filter. Ollama on localhost doesn't care, so one UA is fine for both.
_USER_AGENT = "Mozilla/5.0 (compatible; FlashNewsBot/1.0; +https://flashnews)"


@dataclass
class LLMResult:
    """A completion plus the metadata we keep for the audit trail."""

    text: str
    model: str
    provider: str
    # Best-effort token counts (providers that report them fill these in).
    prompt_tokens: int = 0
    completion_tokens: int = 0


class LLMProvider(Protocol):
    """The one method synthesis depends on. Anything matching this is usable."""

    name: str
    model: str

    def generate(self, *, system: str, prompt: str) -> LLMResult: ...


def _retry_after_seconds(exc: urllib.error.HTTPError, body: str) -> float:
    """How long to wait before retrying a 429, from the header or the body text.

    Prefers the standard ``Retry-After`` header; falls back to parsing Groq's
    "Please try again in 20.25s" message. Capped so we never block too long.
    """
    header = exc.headers.get("Retry-After") if exc.headers else None
    if header:
        try:
            return min(float(header), _MAX_RETRY_WAIT)
        except ValueError:
            pass
    match = re.search(r"try again in ([\d.]+)s", body)
    if match:
        return min(float(match.group(1)) + 0.5, _MAX_RETRY_WAIT)
    return 5.0


def _post_json(
    url: str, payload: dict, timeout: int, headers: dict | None = None, retries: int = 1
) -> dict:
    """POST ``payload`` as JSON and parse the JSON response.

    Wraps the stdlib so both providers share identical error handling: any
    network/parse problem becomes an :class:`LLMError` with a human-readable
    cause instead of a raw traceback. On a ``429`` (rate limit) it waits the
    server-requested interval and retries once — enough to ride out a hosted
    free tier's per-minute token budget.
    """
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data,
        headers={
            "Content-Type": "application/json",
            "User-Agent": _USER_AGENT,
            **(headers or {}),
        },
        method="POST",
    )
    for attempt in range(retries + 1):
        try:
            with urllib.request.urlopen(req, timeout=timeout) as resp:  # noqa: S310 — trusted, configured URL
                raw = resp.read().decode("utf-8")
            return json.loads(raw)
        except urllib.error.HTTPError as exc:  # 4xx/5xx from the model server
            body = exc.read().decode("utf-8", "replace")[:500] if exc.fp else ""
            if exc.code == 429:
                if attempt < retries:
                    wait = _retry_after_seconds(exc, body)
                    logger.info("Rate limited by model server; retrying in %.1fs", wait)
                    time.sleep(wait)
                    continue
                raise LLMError(
                    "Rate limit reached on the hosted model (free tier ~6000 "
                    "tokens/minute). Wait a few seconds and try again, synthesise "
                    "fewer articles at once, or lower AI_MAX_TOKENS. Upgrading your "
                    "Groq tier removes this limit."
                ) from exc
            raise LLMError(
                f"Model server returned HTTP {exc.code}: {body or exc.reason}"
            ) from exc
        except urllib.error.URLError as exc:  # connection refused, DNS, timeout
            raise LLMError(
                f"Could not reach the model server at {url} ({exc.reason}). "
                "Is Ollama running and the model pulled?"
            ) from exc
        except (ValueError, json.JSONDecodeError) as exc:
            raise LLMError(f"Model server sent an unreadable response: {exc}") from exc
    # Unreachable (loop either returns or raises), but keeps type-checkers happy.
    raise LLMError("Model server request failed.")


class OllamaProvider:
    """Local, self-hosted generation via the Ollama HTTP API.

    Uses the non-streaming ``/api/chat`` endpoint: we want the whole article at
    once and store it, not token-by-token UI streaming. ``num_ctx`` is widened
    because multi-source synthesis feeds several articles' worth of text in.
    """

    name = "ollama"

    def __init__(self, base_url: str, model: str, timeout: int, max_tokens: int):
        self.base_url = base_url.rstrip("/")
        self.model = model
        self.timeout = timeout
        self.max_tokens = max_tokens

    def generate(self, *, system: str, prompt: str) -> LLMResult:
        payload = {
            "model": self.model,
            "stream": False,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": prompt},
            ],
            "options": {
                # Low temperature: we want faithful, grounded synthesis, not
                # creative invention that could hallucinate facts.
                "temperature": 0.4,
                "num_ctx": 8192,
                # Cap the generated length so full-length articles aren't cut off.
                "num_predict": self.max_tokens,
            },
        }
        body = _post_json(f"{self.base_url}/api/chat", payload, self.timeout)
        text = (body.get("message") or {}).get("content", "").strip()
        if not text:
            raise LLMError("The model returned an empty completion.")
        return LLMResult(
            text=text,
            model=self.model,
            provider=self.name,
            prompt_tokens=int(body.get("prompt_eval_count") or 0),
            completion_tokens=int(body.get("eval_count") or 0),
        )


class GroqProvider:
    """Hosted fallback via Groq's OpenAI-compatible chat completions API."""

    name = "groq"
    _URL = "https://api.groq.com/openai/v1/chat/completions"

    def __init__(self, api_key: str, model: str, timeout: int, max_tokens: int):
        self.api_key = api_key
        self.model = model
        self.timeout = timeout
        self.max_tokens = max_tokens

    def generate(self, *, system: str, prompt: str) -> LLMResult:
        payload = {
            "model": self.model,
            "temperature": 0.4,
            "max_tokens": self.max_tokens,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": prompt},
            ],
        }
        headers = {"Authorization": f"Bearer {self.api_key}"}
        body = _post_json(self._URL, payload, self.timeout, headers=headers)
        choices = body.get("choices") or []
        if not choices:
            raise LLMError("Groq returned no choices.")
        text = (choices[0].get("message") or {}).get("content", "").strip()
        if not text:
            raise LLMError("Groq returned an empty completion.")
        usage = body.get("usage") or {}
        return LLMResult(
            text=text,
            model=self.model,
            provider=self.name,
            prompt_tokens=int(usage.get("prompt_tokens") or 0),
            completion_tokens=int(usage.get("completion_tokens") or 0),
        )


class DisabledProvider:
    """A null object used when synthesis is switched off or misconfigured.

    Keeps callers branch-free: they always get a provider and call
    :meth:`generate`; this one just fails loudly with a fixable message.
    """

    name = "disabled"
    model = ""

    def __init__(self, reason: str):
        self._reason = reason

    def generate(self, *, system: str, prompt: str) -> LLMResult:
        raise LLMError(self._reason)


def get_provider() -> LLMProvider:
    """Build the provider selected by ``AI_PROVIDER`` in settings.

    Called per request so config changes take effect without a restart, and so
    a test can monkeypatch this one function to inject a fake model.
    """
    choice = (getattr(settings, "AI_PROVIDER", "ollama") or "").lower()
    timeout = int(getattr(settings, "AI_SYNTHESIS_TIMEOUT", 120))
    max_tokens = int(getattr(settings, "AI_MAX_TOKENS", 3000))

    if choice == "ollama":
        return OllamaProvider(
            base_url=getattr(settings, "OLLAMA_BASE_URL", "http://localhost:11434"),
            model=getattr(settings, "OLLAMA_MODEL", "llama3.1:8b"),
            timeout=timeout,
            max_tokens=max_tokens,
        )
    if choice == "groq":
        key = getattr(settings, "GROQ_API_KEY", "")
        if not key:
            return DisabledProvider("AI_PROVIDER=groq but GROQ_API_KEY is not set.")
        return GroqProvider(
            api_key=key,
            model=getattr(settings, "GROQ_MODEL", "llama-3.1-8b-instant"),
            timeout=timeout,
            max_tokens=max_tokens,
        )
    return DisabledProvider(
        f"AI synthesis is disabled (AI_PROVIDER={choice!r}). "
        "Set AI_PROVIDER=ollama (and run Ollama) or AI_PROVIDER=groq."
    )


def provider_status() -> dict:
    """A small, safe summary of the current provider for the admin banner.

    Never leaks the API key — only whether one is present. Used by the status
    endpoint so editors can see at a glance whether synthesis is ready.
    """
    provider = get_provider()
    enabled = not isinstance(provider, DisabledProvider)
    info = {
        "enabled": enabled,
        "provider": provider.name,
        "model": provider.model,
    }
    if not enabled:
        info["reason"] = provider._reason  # noqa: SLF001 — intentional, admin-only
    return info
