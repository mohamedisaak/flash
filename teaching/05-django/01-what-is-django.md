# What is Django?

**Topic:** Django · **Level:** Beginner

## 1. The idea in one sentence

> Django is a Python **web framework** — a big toolbox that handles the boring,
> repetitive parts of building a website/API so you can focus on your actual
> features.

## 2. Analogy

Building a web app from scratch is like building a car by machining every bolt
yourself. Django is a car *kit*: the engine (request handling), wheels
(database access), and dashboard (admin panel) already exist and fit together —
you assemble and customize.

## 3. What Django gives you

- **ORM** (Object-Relational Mapper): work with the database using Python
  classes instead of raw SQL. (See [`05-models.md`](05-models.md).)
- **URL routing**: map web addresses to Python functions.
- **Templates / responses**: build HTML or JSON to send back.
- **Admin site**: an auto-generated back office for your data.
  (See [`07-admin.md`](07-admin.md).)
- **Migrations**: version control for your database structure.
  (See [`06-migrations.md`](06-migrations.md).)
- **Security defaults**: protection against common attacks out of the box.

## 4. In this project

Flash uses Django for the entire backend. The project was created with
`django-admin startproject` and now lives in
[`backend/`](../../backend/). Django is declared as a dependency in
[`backend/pyproject.toml`](../../backend/pyproject.toml).

We use **Django 6** with **Python 3.14**.

## 5. Django vs "Django REST Framework"

Django alone is great for server-rendered HTML sites. Our website and mobile app
instead talk to a **JSON API**, which is why we add **Django REST Framework**
(DRF) on top in Phase 2 (see [`../06-django-rest-framework/`](../06-django-rest-framework/README.md)).
Think: Django = foundation, DRF = the API-shaped layer bolted on.

## 6. Best practices

- Keep settings environment-driven (never hard-code secrets).
- Split big projects into small apps, each with one responsibility.

## 7. Quiz

1. **True/False:** Django forces you to write raw SQL for every query. *(False —
   the ORM writes it for you.)*
2. **MCQ:** Which does Django NOT give you by default? (a) admin site (b) ORM
   (c) a mobile app (d) URL routing. *(Answer: c)*

## 8. Interview questions

- **Junior:** What is a web framework and why use one?
- **Mid:** What is the difference between Django and Django REST Framework?
- **Senior:** When would you *not* choose Django for a project?

← [Django topic index](README.md)
