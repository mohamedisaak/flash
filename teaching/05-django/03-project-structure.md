# Django Project Structure (in this repo)

**Topic:** Django · **Level:** Beginner

## 1. Two key words: *project* vs *app*

- A **project** is the whole Django site (its settings, its URL entry point).
  Ours is the package [`backend/config/`](../../backend/config/).
- An **app** is a self-contained feature module inside the project. We have many:
  `accounts`, `articles`, `categories`, … under
  [`backend/apps/`](../../backend/apps/).

> Analogy: the *project* is the building; each *app* is a department (HR,
> Finance, Sales). Departments are independent but share the same address.

## 2. Why we renamed the project package to `config`

A fresh `startproject flash` puts settings in a package named `flash`. But we
also want a folder to hold our apps, and having both a project *and* concepts
named "flash" is confusing. So the project package is named **`config`** — it
holds configuration, nothing else. This is a widely used convention.

## 3. The layout

```text
backend/
├── manage.py            # CLI entry point (runserver, migrate, ...)
├── pyproject.toml       # dependencies (managed by uv)
├── config/              # the PROJECT: settings + wiring
│   ├── settings.py      # all configuration  → see project-files/settings-py-explained.md
│   ├── urls.py          # root URL routing
│   ├── wsgi.py / asgi.py# servers hand requests to Django here
│   └── __init__.py
└── apps/                # all our feature APPS (bounded contexts)
    ├── common/          # shared base models
    ├── accounts/        # users + roles
    ├── articles/        # the core content
    └── ... (one folder per domain)
```

## 4. What's inside one app

Open [`backend/apps/articles/`](../../backend/apps/articles/):

```text
articles/
├── __init__.py
├── apps.py       # the app's config class (its name/label)
├── models.py     # database tables as Python classes
├── admin.py      # how these models appear in the admin site
└── migrations/   # generated DB-change scripts
```

More files (`serializers.py`, `views.py`, `urls.py`, `services.py`, `tests.py`)
join each app in later phases.

## 5. How the project finds the apps

Each app is listed in `INSTALLED_APPS` in
[`settings.py`](../../backend/config/settings.py) under the `LOCAL_APPS` group,
using its dotted path like `"apps.articles"`. That dotted path works because
`apps/` contains an `__init__.py`, making it a Python package.

## 6. Common mistakes

- Forgetting to add a new app to `INSTALLED_APPS` → its models/migrations are
  ignored.
- Naming an app the same as the project → import confusion (why we use `config`).

## 7. Exercises

- **Beginner:** List every app folder under `backend/apps/` and write one
  sentence on what each is for (hint: read each `apps.py` `verbose_name`).
- **Intermediate:** Add a throwaway app `apps/sandbox` and make it appear in
  `INSTALLED_APPS`. Run `manage.py check`. Then remove it.

## 8. Interview questions

- **Junior:** What is the difference between a Django project and a Django app?
- **Mid:** Why split a codebase into many small apps instead of one big one?

← [Django topic index](README.md)
