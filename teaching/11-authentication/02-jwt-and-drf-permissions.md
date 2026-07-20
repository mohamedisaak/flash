# JWT Authentication & DRF Permissions

**Topic:** Authentication & Authorization · **Level:** Intermediate
**Prerequisites:** [`01-users-and-rbac.md`](01-users-and-rbac.md)

## 1. The idea in one sentence

> A **JWT** is a signed token the client sends with each request to prove who it
> is; **permission classes** then decide what that identity is allowed to do.

## 2. Why tokens (not sessions) for an API

A website with server-rendered pages can use cookie sessions. But our clients are
a separate website and a **mobile app** — they benefit from a **stateless**
token they attach to each request. No server-side session store to scale. That
token is a **JSON Web Token (JWT)**.

## 3. The login flow

```
POST /api/v1/auth/login/   {username, password}
200  {"access": "<short-lived JWT>", "refresh": "<longer-lived JWT>"}

# then, on every protected request:
Authorization: Bearer <access token>

# when the access token expires:
POST /api/v1/auth/login/refresh/   {"refresh": "<refresh token>"}
200  {"access": "<new access token>"}
```

Configured in [`config/settings.py`](../../backend/config/settings.py) under
`SIMPLE_JWT`: access tokens live 30 minutes, refresh tokens 7 days, and refresh
tokens rotate on use. Short access + longer refresh limits the damage if a token
leaks.

Our test proves the full round-trip:
[`apps/accounts/tests/test_auth.py`](../../backend/apps/accounts/tests/test_auth.py)
→ `test_me_uses_token_auth_end_to_end`.

## 4. What's inside a JWT

Three dot-separated parts: `header.payload.signature`. The payload carries the
user id and expiry; the **signature** is made with the server's `SECRET_KEY`.
Anyone can *read* a JWT (it's not encrypted) but nobody can *forge* one without
the secret. **Never put secrets in a JWT payload**, and always serve over HTTPS.

## 5. Permissions = authorization

Authentication says *who you are*; a **permission class** answers *may you do
this?* DRF calls two hooks:

- `has_permission(request, view)` — view-level (can you hit this endpoint at all?)
- `has_object_permission(request, view, obj)` — row-level (can you touch *this*
  object?)

Our reusable classes live in
[`apps/common/permissions.py`](../../backend/apps/common/permissions.py):

| Class | Rule |
|-------|------|
| `ReadOnlyOrEditorialStaff` | anyone reads; only newsroom staff write |
| `IsEditorialStaff` | staff-only endpoint |
| `IsAuthorOrEditorOrReadOnly` | write needs staff; editing a row needs to be its author/editor or a publisher |
| `IsOwnerOrReadOnly` | you may only modify objects you own |

## 6. A bug this design caught

Our first `IsAuthorOrEditorOrReadOnly` allowed *any* logged-in user to create an
article, because `has_object_permission` isn't called on create (there's no
object yet). The test `test_subscriber_cannot_create_article` failed and we
tightened `has_permission` to require `is_editorial_staff` for writes. **Lesson:
object-level checks don't guard creation — the view-level check must.**

## 7. Defense in depth

Three layers stack up:
1. `get_queryset` scoping — you can't even *see* rows you shouldn't.
2. Permission classes — you can't *act* without the right role/ownership.
3. Serializer `read_only_fields` — you can't set fields like `role`, `status`,
   `author`, or `views` from the client.

## 8. Exercises

- **Beginner:** Use Swagger's "Authorize" button with an access token and call
  `/auth/me/`.
- **Intermediate:** Why do we keep `SessionAuthentication` alongside JWT? (Hint:
  the browsable API while logged into `/admin/`.)
- **Advanced:** Add a `IsPhotographerOrReadOnly` permission and apply it to the
  gallery-images endpoint.

## 9. Interview questions

- **Junior:** What is a JWT and how is it sent?
- **Mid:** `has_permission` vs `has_object_permission` — when is each called?
- **Senior:** Trade-offs of stateless JWTs vs server sessions; how do you revoke
  a leaked JWT?

← [Authentication index](README.md)
