# LLM providers & running Ollama on your VPS

Synthesis needs one capability from an AI model: *given a system prompt and a
user prompt, return the completion*. This lesson covers **where that model
runs** and **how we keep the code independent of that choice**.

## The provider interface

We never call a model directly from the business logic. Instead the service
depends on a tiny interface (`apps/synthesis/providers.py`):

```python
class LLMProvider(Protocol):
    name: str
    model: str
    def generate(self, *, system: str, prompt: str) -> LLMResult: ...
```

Anything with that shape is usable. Three implementations ship:

- **`OllamaProvider`** — a model running on *your own server* (default).
- **`GroqProvider`** — a hosted free-tier API, for when the VPS is too small.
- **`DisabledProvider`** — a *null object* returned when nothing is configured,
  so callers never branch on "is AI on?"; they just call `generate` and get a
  clear, fixable error.

`get_provider()` reads `AI_PROVIDER` from settings and builds the right one.
Why bother with the indirection?

1. **Swappability** — moving from self-hosted to hosted is a one-line `.env`
   change (`AI_PROVIDER=ollama` → `groq`). No business logic changes.
2. **Testability** — tests monkeypatch `get_provider` to inject a *fake* model
   that returns canned JSON. We test our pipeline offline, never the LLM. (See
   `tests/test_synthesis.py`.)
3. **The dependency rule** — the service depends on the *interface*, not on any
   vendor. This is the Dependency Inversion Principle in one small file.

## Why Ollama, and what "self-hosted" means

**[Ollama](https://ollama.com)** runs open-weight LLMs (Llama, Qwen, Mistral,
Gemma…) on your own machine and exposes a small HTTP API on
`http://localhost:11434`. Concretely:

- The model **weights live on your VPS's disk** (a few GB) and load into RAM.
- Generation happens **in a process on your server**. **No data leaves the
  box**, and there is **no per-token cost** — you already pay for the VPS.
- You talk to it over plain HTTP, so our provider needs **no SDK** — just the
  standard library's `urllib.request`. (Adding a heavyweight client for one POST
  would not earn its keep — same reasoning as the aggregation fetchers.)

### Setup on the server

```bash
curl -fsSL https://ollama.com/install.sh | sh   # installs + starts the service
ollama pull llama3.1:8b                          # download the model once (~4.7 GB)
curl http://localhost:11434/api/tags             # sanity check: lists installed models
```

Then in `backend/.env`:

```dotenv
AI_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1:8b
```

### Hardware reality check

| Model | RAM needed | Speed (CPU only) | Speed (small GPU) |
|---|---|---|---|
| `llama3.2:3b` | ~4 GB | ~8–15 s | ~1–2 s |
| `llama3.1:8b` | ~8 GB | ~20–40 s | ~2–4 s |
| `qwen2.5:14b` | ~12 GB | slow | ~5–8 s |

On a tiny 1–2 GB VPS, don't run a model locally — set `AI_PROVIDER=groq` with a
free key from [console.groq.com](https://console.groq.com). Same code path,
zero infra. That's the whole point of the provider abstraction.

## The HTTP call, and turning failures into help

`OllamaProvider.generate` POSTs to `/api/chat` with `stream: false` (we want the
whole article at once, not token streaming) and a low `temperature` (0.4 —
faithful synthesis, not creative invention). `num_ctx` is widened to 8192
because multi-source prompts are long.

The shared `_post_json` helper converts every failure mode into an `LLMError`
with a message an editor can act on:

- connection refused / timeout → "Could not reach the model server… Is Ollama
  running and the model pulled?"
- HTTP 404 from Ollama → the model name is wrong / not pulled.

That error travels up to the view, which returns **422** with the text — so the
admin sees *"start Ollama"*, not a 500 stack trace.

## `provider_status()` and the admin banner

The status endpoint calls `provider_status()`, which reports `{enabled,
provider, model, reason?}` **without ever leaking the API key** (only whether
one is present). The News Ingestion page shows this as a green "ready" or amber
"off — here's why" banner, so editors know before they click.

Next: [how the prompt forces original, cited output →](02-prompt-design-for-citation.md)
