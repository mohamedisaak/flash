# Introduction & How to Use This Curriculum

**Status:** 🟢 In progress

Welcome. This curriculum teaches software engineering using a real, growing
production codebase — a news publishing platform called **Flash** — as the
textbook. Every concept is grounded in code you can open, run, and change.

## Who this is for

Someone who starts at **beginner level** and wants to understand every layer of
a modern web + mobile product: the database, the backend API, the website, the
mobile app, and how it all gets deployed and kept secure and fast.

## The learning philosophy

Each lesson tries to:

1. **Start simple** — plain-language explanation first.
2. **Use an analogy** — connect the new idea to something familiar.
3. **Show the real code** — the exact file in this repo that uses the idea.
4. **Go deeper gradually** — edge cases, trade-offs, best practices.
5. **Give you practice** — exercises and quiz questions.
6. **Connect to the real world** — how professionals use this day to day.

## How lessons are organized

- Topics are numbered folders (`05-django/`, `30-database-design/`, …).
- Inside a topic, lessons are numbered markdown files
  (`01-what-is-django.md`, `02-how-django-works.md`, …).
- Two special sub-folders appear inside topics as needed:
  - `project-files/` — deep dives on a specific file
    (e.g. `settings-py-explained.md`).
  - `models/` (Django), `components/` (React), `screens/` (mobile) — deep dives
    on a specific code construct.

## The lesson template

Every substantial lesson follows [`LESSON-TEMPLATE.md`](LESSON-TEMPLATE.md). It
includes: concept, analogy, the code in this project, how it connects to other
parts, common mistakes, best practices, exercises (beginner → advanced) with
solutions, quiz questions, debugging scenarios, and interview questions.

## Teach-as-you-build

Lessons are written **alongside the code that introduces the concept**, never as
a separate afterthought. So a folder marked ⚪ Planned simply means the part of
the platform it teaches hasn't been built yet — its lessons arrive with that
phase (see [`../../PLAN.md`](../../PLAN.md)).

## Where to start right now (Phase 0–1)

The platform currently has its backend database layer built. Follow this order:

1. [`05-django/01-what-is-django.md`](../05-django/01-what-is-django.md)
2. [`05-django/03-project-structure.md`](../05-django/03-project-structure.md)
3. [`05-django/05-models.md`](../05-django/05-models.md)
4. [`30-database-design/00-conventions.md`](../30-database-design/00-conventions.md)
5. [`30-database-design/user-and-roles.md`](../30-database-design/user-and-roles.md)
6. [`29-system-design/01-architecture-overview.md`](../29-system-design/01-architecture-overview.md)

← Back to the [curriculum index](../README.md)
