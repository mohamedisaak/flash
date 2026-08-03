# `apps/synthesis/providers.py` explained

**Concept lesson:** [01 — LLM providers & Ollama](../01-llm-providers-and-ollama.md)

## Why it exists

To isolate *"which AI model, running where"* from the rest of the feature. The
service layer must not know or care whether generation happens on your VPS via
Ollama or on Groq's servers. This file is the seam.

## What problem it solves

Without it, `services.py` would hard-code Ollama's URL and JSON shape. Swapping
providers would mean editing business logic; testing would require a running
model. The `LLMProvider` protocol turns "generate text" into a replaceable part.

## How it works

- **`LLMProvider` (Protocol)** — the one method contract: `generate(system,
  prompt) -> LLMResult`.
- **`LLMResult`** — a dataclass: the text plus audit metadata (model, provider,
  token counts).
- **`_post_json`** — shared stdlib HTTP POST; converts every network/parse
  failure into an `LLMError` with a human-actionable message.
- **`OllamaProvider`** — POSTs to `/api/chat` (`stream:false`, `temperature
  0.4`, `num_ctx 8192`); reads `message.content`, `eval_count`.
- **`GroqProvider`** — same idea against Groq's OpenAI-compatible endpoint with a
  Bearer key.
- **`DisabledProvider`** — null object; `generate` raises a fixable message.
- **`get_provider()`** — factory reading `AI_PROVIDER`; called per request.
- **`provider_status()`** — safe summary for the admin banner (never leaks the
  key).

## How it interacts

- `services.synthesize` calls `get_provider().generate(...)`.
- `views.SynthesisStatusView` calls `provider_status()`.
- `tests` monkeypatch `services.get_provider` to inject a fake — the payoff of
  the abstraction.
- Config comes from `config/settings.py` (`AI_PROVIDER`, `OLLAMA_*`, `GROQ_*`,
  `AI_SYNTHESIS_TIMEOUT`).

## Common mistakes

- **Calling the vendor SDK directly in the service** — recreates the coupling
  this file removes.
- **Leaking the API key** in status output — `provider_status` returns only a
  boolean "enabled", never the key.
- **Swallowing errors** — a failed generation must raise `LLMError`, not return
  `""`; the empty-completion check enforces this.
- **Streaming** — we set `stream:false` on purpose; streaming complicates a
  store-and-parse flow for no user benefit here.

## Best practices shown

- Program to an interface (Protocol), not an implementation.
- Null-object pattern (`DisabledProvider`) to keep callers branch-free.
- Errors carry *remediation*, not just "failed".
- Dependency-free HTTP where one request doesn't justify a library.
