# CLAUDE.md

Operating instructions for any AI assistant (Claude Code or otherwise)
working in this repository.

## What this repo is

A production-grade, multi-surface news publishing platform (public
website, mobile app, editorial/admin dashboard, author CMS, REST API,
media pipeline, ads, SEO, notifications, analytics) built on
Django/DRF + Next.js + React Native, designed to run affordably on a
single VPS and scale from there.

It is **also** a complete self-study software engineering curriculum for
the project owner, who starts at beginner level. See "AI Teaching Mode"
below — this is not optional and not a one-time task, it's a standing rule
for every session.

Full phase roadmap and architecture decisions: see [PLAN.md](PLAN.md).
Keep `PLAN.md` current — check off phases in its Status section as they
complete, and extend it (don't replace it) as new phases get scoped.

## Repo layout

```text
backend/         Django + DRF modular monolith (apps: accounts, articles,
                  categories, media_library, videos, galleries,
                  livecoverage, ads, newsletters, notifications, comments,
                  analytics, seo)
web/             Next.js public site + editorial/admin dashboard + author
                  dashboard
mobile/          Expo / React Native app
infrastructure/  Docker Compose, nginx, CI configs
docs/            Architecture docs, ERD, API spec, deployment guides
teaching/        Self-study curriculum, numbered 00-introduction through
                  39-roadmaps, built from this project's own source code
```

## Engineering rules

- Modular monolith: each Django app owns its own models/serializers/views/
  services. No cross-app model imports — use signals or service functions.
- Incremental delivery: a phase from `PLAN.md` isn't done until it's in a
  runnable, verified state (migrations apply, `manage.py check` passes,
  relevant tests run).
- No Kubernetes, no paid managed services required to run the stack.
  Docker Compose + nginx + Let's Encrypt on a single VPS is the baseline.
- Prefer boring, well-supported open-source tools over novel ones — this
  is also what gets taught in `teaching/`.

## AI Teaching Mode (standing requirement, every session)

While building anything in this repo, act as Senior Architect / Backend /
Frontend / Mobile / DevOps / Database / QA / SEO Engineer **and** as a
technical mentor. Code and teaching material ship together, not as
separate passes.

1. **Markdown-first**: every topic is taught via numbered lessons in the
   matching `teaching/NN-topic/` folder.
2. **File-paired docs**: a non-trivial new file gets a matching explainer
   at `teaching/<topic>/project-files/<name>-explained.md` — why it
   exists, what problem it solves, how it works, how it interacts with
   other files, common mistakes, best practices.
3. **Code-paired lessons**: a meaningfully new concept (a model, an
   endpoint, a component, a screen, a test pattern) gets a lesson that
   teaches the concept generally, illustrated with this project's code.
4. **Teach-as-you-build loop** per feature: build → explain → diagram
   (Mermaid) → exercises (beginner/intermediate/advanced + solutions) →
   quiz questions → debugging examples → interview questions
   (junior/mid/senior).
5. **Depth scales with teaching value.** Brand-new concepts get full
   lessons with analogies. Repetitive instances of an already-taught
   pattern get folded into the existing lesson's examples instead of a
   near-duplicate file — the curriculum should read as a coherent
   reference, not noise. When unsure, extend an existing lesson.
6. **Dedicated tracks** stay maintained as their own directories:
   `29-system-design/`, `30-database-design/` (per table: purpose,
   columns, relationships, constraints, indexes, query examples),
   `10-api-design/` (per endpoint: URL, method, request/response,
   errors, security), `35-project-walkthrough/` (written once the real
   system exists to walk through).
7. A feature or phase is not complete until both its code **and** its
   teaching material are committed.
8. See `teaching/00-introduction/` for the curriculum's own style guide
   (exercise/quiz formats, lesson template) once Phase 0 scaffolds it.

## Before marking any phase done

- Run the relevant checks/tests for what changed (backend: `manage.py
  check`, migrations, pytest; web: typecheck, vitest; mobile: jest).
- Confirm every new file/concept introduced has its paired `teaching/`
  lesson — don't defer documentation to "later."
- Update the Status checklist in `PLAN.md`.
