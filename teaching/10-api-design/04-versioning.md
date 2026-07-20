# API Versioning & Documentation

**Topic:** API Design · **Level:** Intermediate

## 1. Why version an API

Once a mobile app is in users' hands, you can't change the API out from under it.
If you need a breaking change, you ship it under a **new version** and leave the
old one running until clients migrate. That's why every URL starts with
`/api/v1/`.

## 2. How we do it

URL-path versioning — the simplest, most visible scheme. In
[`config/urls.py`](../../backend/config/urls.py):

```python
path("api/v1/", include(("config.api_v1", "v1"), namespace="v1")),
```

Everything lives under `/api/v1/`. A future breaking change would go to
`/api/v2/` (a new aggregator module) while `v1` keeps serving old clients.

## 3. The aggregator ("composition root")

[`config/api_v1.py`](../../backend/config/api_v1.py) is the one place allowed to
import from every app, assembling their routers under the version prefix. Each
app stays self-contained (its own `urls.py`); the aggregator just wires them
together. This keeps the modular monolith modular.

## 4. Self-documenting: OpenAPI + Swagger

We don't hand-write API docs — they'd rot. Instead **drf-spectacular** reads our
serializers and viewsets and generates an **OpenAPI 3** schema. Three URLs expose
it:

| URL | What |
|-----|------|
| `/api/schema/` | the raw OpenAPI YAML |
| `/api/docs/` | Swagger UI — interactive "try it" explorer |
| `/api/redoc/` | ReDoc — clean reference docs |

Generate the schema file yourself:

```bash
uv run python manage.py spectacular --file schema.yml
```

We keep the schema **warning-free** (type hints on computed fields, stable enum
names, guarded querysets), which is a good discipline: a clean schema means clean,
predictable client code generation.

## 5. Common mistakes

- Never versioning, then breaking every client with one deploy.
- Letting the docs drift from reality by writing them by hand — generate them.
- Ignoring schema warnings until client codegen produces `Status18bEnum`.

## 6. Exercises

- **Beginner:** Open `/api/docs/`, authorize with a token, and call
  `GET /articles/` from the browser.
- **Intermediate:** Generate `schema.yml` and find how `ArticleStatus` is
  represented.
- **Advanced:** Sketch what shipping `/api/v2/articles/` with a renamed field
  would look like without breaking `v1`.

## 7. Interview questions

- **Junior:** Why version an API?
- **Mid:** Compare URL, header, and query-param versioning.
- **Senior:** How do you deprecate and sunset an old API version safely?

← [API Design index](README.md)
