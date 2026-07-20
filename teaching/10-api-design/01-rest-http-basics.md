# REST & HTTP Basics

**Topic:** API Design · **Level:** Beginner

## 1. What is an API?

An **API** is a contract: a defined set of requests a client can make and
responses it will get back. Ours speaks **HTTP** and returns **JSON**.

## 2. HTTP methods (verbs)

| Method | Meaning | Safe? | Example |
|--------|---------|-------|---------|
| `GET` | read | yes (no changes) | `GET /api/v1/articles/` |
| `POST` | create | no | `POST /api/v1/articles/` |
| `PUT` | replace whole object | no | `PUT /api/v1/articles/x/` |
| `PATCH` | update some fields | no | `PATCH /api/v1/articles/x/` |
| `DELETE` | remove | no | `DELETE /api/v1/articles/x/` |

"Safe" methods don't change data — that's why our audit log only records the
others.

## 3. Status codes (the response's headline)

| Code | Means |
|------|-------|
| `200 OK` | success (read/update) |
| `201 Created` | success, made something new |
| `400 Bad Request` | your input was invalid |
| `401 Unauthorized` | you're not logged in |
| `403 Forbidden` | logged in, but not allowed |
| `404 Not Found` | no such thing |
| `429 Too Many Requests` | rate-limited (throttling) |

Note the 401 vs 403 distinction — our tests assert both in the right places.

## 4. In this project

Every endpoint follows these conventions. You can see them interactively at
`/api/docs/` (Swagger). Example round-trip:

```
POST /api/v1/auth/login/     {"username": "...", "password": "..."}
200  {"access": "<jwt>", "refresh": "<jwt>"}
```

## 5. Interview questions

- **Junior:** Difference between `PUT` and `PATCH`? Between `401` and `403`?
- **Mid:** What makes `GET` "safe" and "idempotent"?

← [API Design index](README.md)
