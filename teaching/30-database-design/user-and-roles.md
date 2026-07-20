# Tables: User & Roles (RBAC)

Real code: [`apps/accounts/models.py`](../../backend/apps/accounts/models.py).
Concepts: [00-conventions.md](00-conventions.md) ·
[11-authentication](../11-authentication/README.md).

## Table: `accounts_user`

The one user table for the whole platform. We replaced Django's built-in user
with a custom one so we can add newsroom fields. (Why up front? Swapping the user
model after migrating is very painful.)

### Columns

| Column | Type | Notes |
|--------|------|-------|
| `id` | bigint PK | auto |
| `username` | varchar, unique | from `AbstractUser` |
| `email` | varchar, **unique** | we made it unique (login by email later) |
| `password` | varchar | stored **hashed**, never plaintext |
| `first_name`, `last_name` | varchar | from `AbstractUser` |
| `phone` | varchar | contact |
| `avatar` | image | profile picture upload |
| `bio` | text | author biography |
| `social_links` | JSON | flexible map, e.g. `{"x": "...", "linkedin": "..."}` |
| `role` | varchar (enum) | primary editorial title — indexed |
| `status` | varchar (enum) | active / pending / suspended / banned — indexed |
| `is_staff`, `is_active`, `is_superuser` | bool | from `AbstractUser` |
| `last_login`, `date_joined` | datetime | from `AbstractUser` |

Extra index: composite `(role, status)` — we frequently list "active
journalists", etc.

### The `role` enum (RBAC)

`Role` (a `TextChoices`) encodes the newsroom hierarchy: Super Admin, Admin,
Editor in Chief, Managing Editor, Section Editor, Journalist, Author,
Photographer, Video Editor, Moderator, Subscriber.

**Two layers of authorization** (see the authentication topic):
1. `role` — a single coarse title used for display and quick checks like
   `user.can_publish` and `user.is_editorial_staff` (helper properties on the
   model).
2. Django Groups & Permissions — the fine-grained "can do X" rules, wired up in
   Phase 2 when the API needs enforcement.

### Why passwords are safe

Django never stores the raw password. On save it runs a one-way hash (PBKDF2 by
default). Even we can't read it back — login works by hashing the attempt and
comparing hashes.

## Relationships from other tables → user

- `articles.Article.author` → PROTECT (can't delete an author with articles).
- `articles.Article.editor` → SET_NULL (optional).
- `comments.Comment.author` → CASCADE (a user's comments go with them).
- `newsletters.NewsletterSubscriber.user` → SET_NULL (anonymous signups allowed).
- `notifications.Notification.recipient` → CASCADE.

## Exercises

- **Beginner:** List the 11 roles. Which ones return `True` for `can_publish`?
- **Intermediate:** In the shell, create a user with `role="author"` and check
  `user.can_publish` (False) vs `user.is_editorial_staff` (True).
- **Advanced:** Explain why `email` was made `unique` and what breaks if two
  users share an email when we later add "login by email."

## Interview questions

- **Junior:** Why are passwords hashed and not encrypted-and-decrypted?
- **Mid:** What is RBAC and how is it modelled here?
- **Senior:** Compare a single `role` column vs Django Groups/Permissions vs a
  full policy engine — when does each stop scaling?

← Back to the [Database Design index](README.md)
