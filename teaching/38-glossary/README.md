# Glossary

**Status:** 🟢 In progress

Plain-language definitions of terms used across the project. Grows as new
concepts appear. Alphabetical.

- **API (Application Programming Interface)** — a defined way for programs to talk
  to each other. Ours is a REST/JSON API served by Django.
- **Abstract base model** — a Django model with `abstract = True`: no table of its
  own; other models inherit its fields. Example: `TimeStampedModel`.
- **Authentication (authN)** — proving *who* you are (login).
- **Authorization (authZ)** — deciding *what* you may do (permissions/roles).
- **Cache** — a fast, temporary store of computed/fetched data to avoid redoing
  work. We use Redis.
- **Celery** — a system for running tasks in the background, off the web request.
- **Container** — an isolated, disposable box that runs software the same way
  everywhere. Managed with Docker.
- **CTR (Click-Through Rate)** — clicks ÷ impressions; how often an ad is clicked.
- **Denormalization** — storing a computed/duplicated value (like `Article.views`)
  for read speed, accepting the cost of keeping it in sync.
- **DRF (Django REST Framework)** — the library that turns Django into a JSON API.
- **Enum / `TextChoices`** — a fixed set of allowed values (e.g. article status).
- **ERD (Entity-Relationship Diagram)** — a picture of tables and their links.
- **Foreign key (FK)** — a column linking a row to one row in another table
  (one-to-many).
- **Full-text search** — searching within text content, ranked by relevance
  (PostgreSQL provides it; OpenSearch later).
- **Hashing** — a one-way transform; used to store passwords so they can't be
  read back.
- **HLS (HTTP Live Streaming)** — chops video into small chunks for adaptive
  streaming.
- **Index (database)** — a lookup structure that makes filtering/sorting fast.
- **ISR (Incremental Static Regeneration)** — Next.js re-builds a static page in
  the background on a schedule; fast *and* fresh.
- **JWT (JSON Web Token)** — a signed token proving identity across requests
  without server-side sessions.
- **Many-to-many (M2M)** — rows on both sides link freely (Articles ↔ Tags), via a
  hidden join table.
- **Migration** — a version-controlled script that changes the database structure
  to match the models.
- **Modular monolith** — one deployable app internally split into loosely-coupled
  modules (our Django apps).
- **ORM (Object-Relational Mapper)** — write Python instead of SQL; Django's ORM
  maps classes ↔ tables.
- **Reverse proxy** — a server (Nginx) that sits in front of the app, handling TLS
  and forwarding requests.
- **Slug** — the URL-safe identifier of a page, e.g. `some-story-title`.
- **SSR / SSG** — Server-Side Rendering / Static Site Generation (Next.js
  strategies for producing HTML).
- **`on_delete`** — the rule for what happens to child rows when a parent is
  deleted (PROTECT / CASCADE / SET_NULL).

← Back to the [curriculum index](../README.md)
