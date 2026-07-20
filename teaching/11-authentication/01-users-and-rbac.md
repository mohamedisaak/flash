# Users, Passwords & RBAC

**Topic:** Authentication & Authorization · **Level:** Beginner → Intermediate

## 1. Two different questions

- **Authentication** = "Who are you?" (prove your identity — login).
- **Authorization** = "What are you allowed to do?" (permissions).

People mix these up constantly. Login is authN; role checks are authZ.

## 2. The custom user model

Real code: [`apps/accounts/models.py`](../../backend/apps/accounts/models.py).

We replaced Django's built-in user with our own `User` (setting
`AUTH_USER_MODEL = "accounts.User"`) so we can store newsroom fields: `phone`,
`avatar`, `bio`, `social_links`, `role`, `status`. **This decision must be made
before the first migration** — changing it later is very painful.

## 3. Passwords are hashed, never stored raw

When you set a password, Django runs it through a one-way hash (PBKDF2 by
default) and stores only the hash. Login re-hashes the attempt and compares. Even
the database admin can't read the original. Never store or log plaintext
passwords.

## 4. RBAC: roles

Real code: the `Role` enum. Our newsroom hierarchy: Super Admin, Admin, Editor in
Chief, Managing Editor, Section Editor, Journalist, Author, Photographer, Video
Editor, Moderator, Subscriber.

We model authorization in **two layers**:

1. A coarse `role` column + helper properties (`user.can_publish`,
   `user.is_editorial_staff`) for quick checks and display.
2. Django's Groups & Permissions for fine-grained rules, enforced in the API in
   Phase 2 (DRF permission classes).

```python
@property
def can_publish(self) -> bool:
    return self.role in {Role.SUPER_ADMIN, Role.ADMIN, Role.EDITOR_IN_CHIEF,
                         Role.MANAGING_EDITOR, Role.SECTION_EDITOR}
```

So an **Author** can write and submit for review, but only **editors/admins** can
push a story live. That's authorization encoded as data + rules.

## 5. Account status

Separate from role, `status` (active/pending/suspended/banned) controls whether
a user can act at all — e.g. a banned Subscriber keeps their role but can't
comment.

## 6. What's coming (Phase 2)

- **JWT** tokens so the mobile app and website can authenticate statelessly.
- Password reset flows.
- DRF permission classes that read `role`/permissions to guard each endpoint.

## 7. Common mistakes

- Confusing authN and authZ.
- Checking `is_staff`/`is_superuser` for business rules instead of real roles.
- Deciding on a custom user model *after* migrating.

## 8. Exercises

- **Beginner:** In the shell, create an Author and an Editor; compare
  `can_publish`.
- **Intermediate:** Explain how a `suspended` Editor differs from a
  `role="subscriber"` active user in terms of authN vs authZ.

## 9. Interview questions

- **Junior:** Difference between authentication and authorization?
- **Mid:** Why hash passwords instead of encrypting them?
- **Senior:** Compare a single `role` column, Django Groups/Permissions, and an
  external policy engine (e.g. OPA). When does each break down?

← [Authentication index](README.md)
