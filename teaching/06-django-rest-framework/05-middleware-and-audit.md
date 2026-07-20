# Middleware & Audit Logging

**Topic:** Django REST Framework / Django · **Level:** Intermediate

## 1. The idea in one sentence

> Middleware is code that runs **around every request/response**, so it's the
> perfect place for cross-cutting concerns like logging, security headers, or
> auth — things every endpoint needs but none should repeat.

## 2. Analogy

Middleware is a series of **security checkpoints at an airport**: every passenger
(request) passes through each one on the way in, and again on the way out. Each
checkpoint can inspect, stamp, or turn back the traveller.

## 3. The shape of a middleware

[`apps/common/middleware.py`](../../backend/apps/common/middleware.py):

```python
class AuditLogMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)          # ← everything before this
        # ...runs on the way OUT, after the view produced a response...
        if request.method in WRITE_METHODS and request.path.startswith("/api/"):
            logger.info("audit %s %s -> %s by %s", ...)
        return response
```

Code before `self.get_response(request)` runs on the way *in*; code after runs on
the way *out*. Ours logs after, because it wants the response status code.

## 4. Why audit logging

Security and accountability demand answering "**who** changed **what**, and
**when**?" We log every state-changing API call (POST/PUT/PATCH/DELETE) with the
acting user and the resulting status. It's wired into the chain in
[`config/settings.py`](../../backend/config/settings.py)'s `MIDDLEWARE`, and
writes to the `flash.audit` logger configured under `LOGGING`.

You can see it fire in the test output:
```
INFO flash.audit: audit POST /api/v1/articles/ -> 201 by user:1(reader)
```

## 5. Order matters

Middleware runs top-to-bottom on the way in. Auth middleware must come *before*
ours, or `request.user` wouldn't be populated when we log it. That's why
`AuditLogMiddleware` sits at the **end** of the list.

## 6. Common mistakes

- Doing heavy work in middleware (it runs on *every* request) → slows everything.
- Placing a middleware that needs `request.user` before the auth middleware.
- Logging request bodies blindly → can capture passwords/PII. We log metadata
  only.

## 7. Exercises

- **Beginner:** Trigger a write in Swagger and find the audit line in the server
  console.
- **Intermediate:** Extend the log to include the client IP
  (`request.META["REMOTE_ADDR"]`).
- **Advanced:** Persist audit records to a database table instead of the log, and
  discuss the trade-offs (queryability vs write cost).

## 8. Interview questions

- **Junior:** What is middleware?
- **Mid:** Why does middleware order matter? Give an example.
- **Senior:** Where would you implement audit logging — middleware, signals, or
  the service layer — and why?

← [DRF topic index](README.md)
