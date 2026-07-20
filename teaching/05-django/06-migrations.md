# Django Migrations

**Topic:** Django · **Level:** Beginner
**Prerequisites:** [`05-models.md`](05-models.md)

## 1. The idea in one sentence

> A **migration** is an auto-generated, version-controlled script that changes
> your database structure to match your models.

## 2. Analogy

Models are the *design* of a building; migrations are the *construction permits
and work orders* that actually change the physical structure — and they're
numbered so you always know what was built in what order.

## 3. The two commands

```bash
uv run python manage.py makemigrations   # "look at my models, write a change file"
uv run python manage.py migrate          # "apply pending change files to the DB"
```

`makemigrations` compares your current models to the last recorded state and
writes a new file into the app's `migrations/` folder (e.g.
`apps/articles/migrations/0001_initial.py`). `migrate` runs any files that
haven't been applied yet and records that it did.

## 4. In this project

When Phase 1's models were created, we ran `makemigrations` once and Django
generated an `0001_initial.py` for every app. Look at
[`apps/articles/migrations/`](../../backend/apps/articles/migrations/) — those
files are committed to git so every teammate and server builds an identical DB.

## 5. The golden rules

1. **Migrations are code — commit them.** Never `.gitignore` them.
2. **Never edit the database by hand.** Change the model, then migrate.
3. **`makemigrations --check`** in CI fails the build if someone changed a model
   but forgot to generate the migration. We use exactly this check.

## 6. Common mistakes

- Changing a model and running `migrate` without `makemigrations` first →
  nothing happens; `migrate` only applies existing files.
- Deleting a migration that's already applied on a server → the server's history
  no longer matches; migrations get confused.

## 7. Exercises

- **Beginner:** Run `uv run python manage.py showmigrations` and read the list of
  applied (`[X]`) migrations.
- **Intermediate:** Add a field to any model, run `makemigrations`, open the
  generated file, and read what operation it created. Then `migrate`.

## 8. Interview questions

- **Junior:** What problem do migrations solve?
- **Mid:** Why must migration files be committed to version control?
- **Senior:** How would you safely add a `NOT NULL` column to a huge table in
  production?

← [Django topic index](README.md)
