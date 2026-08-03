"""
Tests for AI synthesis.

The model is always faked — we inject a fake provider by monkeypatching
``services.get_provider``, so tests are offline, deterministic, and assert the
*behaviour we control*: grounded prompting, sanitisation, citations, draft-only
output, and provenance. We never test the LLM itself.
"""

import json

import pytest
from rest_framework.test import APIClient

from apps.accounts.models import Role, User
from apps.aggregation.models import AggregatedArticle
from apps.articles.models import Article, ArticleStatus
from apps.synthesis import services
from apps.synthesis.models import SynthesisJob, SynthesisStatus
from apps.synthesis.providers import LLMError, LLMResult


# --------------------------------------------------------------------------- #
# Fixtures
# --------------------------------------------------------------------------- #
@pytest.fixture
def staff(db):
    return User.objects.create_user(username="ed", password="x", role=Role.EDITOR_IN_CHIEF)


@pytest.fixture
def api(staff):
    c = APIClient()
    c.force_authenticate(staff)
    return c


@pytest.fixture
def items(db):
    """Two aggregated items with full bodies already fetched."""
    rows = []
    for i, name in enumerate(["BBC", "Reuters"], start=1):
        rows.append(
            AggregatedArticle.objects.create(
                source=name.lower(),
                source_name=name,
                region="international",
                external_id=f"{name}-{i}",
                url=f"https://example.com/{name.lower()}/{i}",
                title=f"{name} reports on the summit",
                summary="Leaders met to discuss trade.",
                content="<p>Leaders from ten nations met on Tuesday to discuss trade.</p>",
                content_fetched=True,
            )
        )
    return rows


def _fake_provider(payload: dict, *, provider="ollama", model="llama3.1:8b"):
    """Build a stand-in provider whose generate() returns a fixed JSON payload."""

    class _Fake:
        name = provider

        def __init__(self):
            self.model = model
            self.last_prompt = None

        def generate(self, *, system, prompt):
            self.last_prompt = prompt
            return LLMResult(
                text=json.dumps(payload),
                model=model,
                provider=provider,
                prompt_tokens=100,
                completion_tokens=200,
            )

    return _Fake()


_GOOD_OUTPUT = {
    "title": "Ten nations open trade summit",
    "excerpt": "Leaders gathered on Tuesday to discuss a new trade framework.",
    "body_html": "<p>Ten nations began talks on Tuesday.</p><p>Officials cited trade.</p>",
    "meta_description": "Ten nations opened a trade summit on Tuesday.",
}


# --------------------------------------------------------------------------- #
# Service-level behaviour
# --------------------------------------------------------------------------- #
@pytest.mark.django_db
def test_synthesize_creates_draft_with_citations(monkeypatch, staff, items):
    fake = _fake_provider(_GOOD_OUTPUT)
    monkeypatch.setattr(services, "get_provider", lambda: fake)
    monkeypatch.setattr(services, "_download_image", lambda a, u: None)

    job = services.synthesize([i.id for i in items], staff, category_slug="world")

    assert job.status == SynthesisStatus.SUCCESS
    article = job.article
    assert article is not None
    # Draft-only: never auto-published (the anti-deindex + editorial-review rule).
    assert article.status == ArticleStatus.DRAFT
    assert article.published_at is None
    # Citations are kept, not stripped: both outlets are linked out.
    assert "<h2>Sources</h2>" in article.content
    assert "https://example.com/bbc/1" in article.content
    assert "https://example.com/reuters/2" in article.content
    assert "BBC" in article.content and "Reuters" in article.content
    # Self-canonical: original piece, no duplicate-content pointer elsewhere.
    assert article.canonical_url == ""
    # Provenance recorded on the job and the source rows.
    assert set(job.sources.values_list("id", flat=True)) == {i.id for i in items}
    for i in items:
        i.refresh_from_db()
        assert i.imported_article_id == article.id


@pytest.mark.django_db
def test_prompt_contains_all_source_material(monkeypatch, staff, items):
    fake = _fake_provider(_GOOD_OUTPUT)
    monkeypatch.setattr(services, "get_provider", lambda: fake)
    monkeypatch.setattr(services, "_download_image", lambda a, u: None)

    services.synthesize([i.id for i in items], staff)

    # The prompt must be grounded in every selected source, by name + URL.
    assert "BBC" in fake.last_prompt and "Reuters" in fake.last_prompt
    assert "https://example.com/bbc/1" in fake.last_prompt


@pytest.mark.django_db
def test_output_html_is_sanitised(monkeypatch, staff, items):
    malicious = {
        **_GOOD_OUTPUT,
        "body_html": "<p>Clean.</p><script>alert(1)</script><img src=x onerror=alert(1)>",
    }
    monkeypatch.setattr(services, "get_provider", lambda: _fake_provider(malicious))
    monkeypatch.setattr(services, "_download_image", lambda a, u: None)

    job = services.synthesize([items[0].id], staff)

    assert "<script>" not in job.article.content
    assert "onerror" not in job.article.content
    assert "<p>Clean.</p>" in job.article.content


@pytest.mark.django_db
def test_output_wrapped_in_code_fences_is_parsed(monkeypatch, staff, items):
    class _Fenced:
        name, model = "ollama", "llama3.1:8b"

        def generate(self, *, system, prompt):
            fenced = "```json\n" + json.dumps(_GOOD_OUTPUT) + "\n```"
            return LLMResult(text=fenced, model=self.model, provider=self.name)

    monkeypatch.setattr(services, "get_provider", lambda: _Fenced())
    monkeypatch.setattr(services, "_download_image", lambda a, u: None)

    job = services.synthesize([items[0].id], staff)
    assert job.status == SynthesisStatus.SUCCESS
    assert job.article.title == _GOOD_OUTPUT["title"]


@pytest.mark.django_db
def test_body_with_raw_newlines_is_parsed(monkeypatch, staff, items):
    """A long body_html with literal newlines must not fail JSON parsing."""

    class _MultiLine:
        name, model = "groq", "llama-3.1-8b-instant"

        def generate(self, *, system, prompt):
            # Raw control characters (newlines) inside the JSON string — invalid
            # under strict JSON, but the model does this with long HTML bodies.
            payload = (
                '{"title": "T", "excerpt": "E",\n'
                '"body_html": "<p>Line one.</p>\n<p>Line two.</p>",\n'
                '"meta_description": "M"}'
            )
            return LLMResult(text=payload, model=self.model, provider=self.name)

    monkeypatch.setattr(services, "get_provider", lambda: _MultiLine())
    monkeypatch.setattr(services, "_download_image", lambda a, u: None)

    job = services.synthesize([items[0].id], staff)
    assert job.status == SynthesisStatus.SUCCESS
    assert "Line one." in job.article.content and "Line two." in job.article.content


@pytest.mark.django_db
def test_model_error_records_error_job(monkeypatch, staff, items):
    class _Boom:
        name, model = "ollama", "llama3.1:8b"

        def generate(self, *, system, prompt):
            raise LLMError("Could not reach the model server.")

    monkeypatch.setattr(services, "get_provider", lambda: _Boom())

    with pytest.raises(LLMError):
        services.synthesize([items[0].id], staff)

    job = SynthesisJob.objects.latest("created_at")
    assert job.status == SynthesisStatus.ERROR
    assert "model server" in job.error
    assert Article.objects.count() == 0


@pytest.mark.django_db
def test_malformed_json_raises_synthesis_error(monkeypatch, staff, items):
    class _Junk:
        name, model = "ollama", "llama3.1:8b"

        def generate(self, *, system, prompt):
            return LLMResult(text="I cannot help with that.", model=self.model, provider=self.name)

    monkeypatch.setattr(services, "get_provider", lambda: _Junk())

    with pytest.raises(services.SynthesisError):
        services.synthesize([items[0].id], staff)
    assert SynthesisJob.objects.latest("created_at").status == SynthesisStatus.ERROR


# --------------------------------------------------------------------------- #
# API
# --------------------------------------------------------------------------- #
@pytest.mark.django_db
def test_run_endpoint_returns_job(monkeypatch, api, items):
    monkeypatch.setattr(services, "get_provider", lambda: _fake_provider(_GOOD_OUTPUT))
    monkeypatch.setattr(services, "_download_image", lambda a, u: None)

    resp = api.post(
        "/api/v1/synthesis/jobs/run/",
        {"ids": [i.id for i in items], "category": "world"},
        format="json",
    )
    assert resp.status_code == 201, resp.content
    assert resp.data["status"] == "success"
    assert resp.data["article_slug"]


@pytest.mark.django_db
def test_run_endpoint_rejects_empty_ids(api):
    resp = api.post("/api/v1/synthesis/jobs/run/", {"ids": []}, format="json")
    assert resp.status_code == 400


@pytest.mark.django_db
def test_model_failure_returns_422(monkeypatch, api, items):
    class _Boom:
        name, model = "ollama", "llama3.1:8b"

        def generate(self, *, system, prompt):
            raise LLMError("Ollama not running.")

    monkeypatch.setattr(services, "get_provider", lambda: _Boom())
    resp = api.post("/api/v1/synthesis/jobs/run/", {"ids": [items[0].id]}, format="json")
    assert resp.status_code == 422
    assert "Ollama" in resp.data["detail"]


@pytest.mark.django_db
def test_status_endpoint_reports_provider(api, settings):
    settings.AI_PROVIDER = "ollama"
    settings.OLLAMA_MODEL = "llama3.1:8b"
    resp = api.get("/api/v1/synthesis/status/")
    assert resp.status_code == 200
    assert resp.data["provider"] == "ollama"
    assert resp.data["enabled"] is True


@pytest.mark.django_db
def test_status_endpoint_disabled_when_groq_key_missing(api, settings):
    settings.AI_PROVIDER = "groq"
    settings.GROQ_API_KEY = ""
    resp = api.get("/api/v1/synthesis/status/")
    assert resp.data["enabled"] is False
    assert "GROQ_API_KEY" in resp.data["reason"]


@pytest.mark.django_db
def test_requires_staff(db, items):
    """A non-staff user cannot reach synthesis endpoints."""
    reader = User.objects.create_user(username="reader", password="x", role=Role.SUBSCRIBER)
    c = APIClient()
    c.force_authenticate(reader)
    assert c.get("/api/v1/synthesis/status/").status_code == 403
    assert (
        c.post("/api/v1/synthesis/jobs/run/", {"ids": [items[0].id]}, format="json").status_code
        == 403
    )


# --------------------------------------------------------------------------- #
# Provider HTTP layer — rate-limit (429) handling
# --------------------------------------------------------------------------- #
def _http_429(url: str):
    """Build a 429 HTTPError with a Retry-After header, like Groq sends."""
    import email.message
    import io
    import urllib.error

    hdrs = email.message.Message()
    hdrs["Retry-After"] = "0"
    return urllib.error.HTTPError(url, 429, "Too Many Requests", hdrs, io.BytesIO(b'{"error":"rate"}'))


class _FakeResp:
    def __init__(self, data: bytes):
        self._data = data

    def read(self):
        return self._data

    def __enter__(self):
        return self

    def __exit__(self, *a):
        return False


def test_post_json_retries_once_on_429(monkeypatch):
    from apps.synthesis import providers

    calls = {"n": 0}

    def fake_urlopen(req, timeout):
        calls["n"] += 1
        if calls["n"] == 1:
            raise _http_429(req.full_url)
        return _FakeResp(json.dumps({"ok": True}).encode())

    monkeypatch.setattr(providers.urllib.request, "urlopen", fake_urlopen)
    monkeypatch.setattr(providers.time, "sleep", lambda _s: None)  # don't actually wait

    out = providers._post_json("https://api.groq.com/x", {"a": 1}, timeout=5)
    assert out == {"ok": True}
    assert calls["n"] == 2  # failed once, retried, succeeded


def test_post_json_raises_friendly_after_429_exhausted(monkeypatch):
    from apps.synthesis import providers

    def fake_urlopen(req, timeout):
        raise _http_429(req.full_url)

    monkeypatch.setattr(providers.urllib.request, "urlopen", fake_urlopen)
    monkeypatch.setattr(providers.time, "sleep", lambda _s: None)

    with pytest.raises(providers.LLMError, match="Rate limit"):
        providers._post_json("https://api.groq.com/x", {}, timeout=5)
