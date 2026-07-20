# What is Django REST Framework?

**Topic:** Django REST Framework · **Level:** Beginner
**Prerequisites:** [`../05-django/01-what-is-django.md`](../05-django/01-what-is-django.md)

## 1. The idea in one sentence

> Django REST Framework (DRF) is a toolkit that turns your Django models into a
> **JSON API** — the thing your website and mobile app talk to.

## 2. Why we need it

Django by itself renders HTML pages. But our website (Next.js) and mobile app
(Expo) are separate programs that just want **data**, not HTML. They ask the
backend questions like "give me the latest articles" and expect JSON back. DRF
provides the machinery to expose exactly that.

```
Browser/App  ──HTTP request──▶  DRF (Django)  ──▶  Database
             ◀──JSON response──
```

## 3. The four building blocks

| Piece | Job | Lesson |
|-------|-----|--------|
| **Serializer** | translate models ↔ JSON, and validate input | [02-serializers.md](02-serializers.md) |
| **View / ViewSet** | handle a request and return a response | [03-viewsets-and-routers.md](03-viewsets-and-routers.md) |
| **Router** | generate URLs for a viewset automatically | [03-viewsets-and-routers.md](03-viewsets-and-routers.md) |
| **Permission** | decide who's allowed to do what | [../11-authentication/02-jwt-and-drf-permissions.md](../11-authentication/02-jwt-and-drf-permissions.md) |

## 4. In this project

DRF is enabled in [`config/settings.py`](../../backend/config/settings.py) under
`THIRD_PARTY_APPS`, with a `REST_FRAMEWORK` config block that sets sensible
defaults for the whole API: JWT auth, "authenticated by default" permissions,
pagination, filtering, and rate limiting. Every app then adds its own
`serializers.py`, `views.py`, and `urls.py`.

Browse the live result at `/api/docs/` (Swagger) once the server is running.

## 5. Interview questions

- **Junior:** Why do we need DRF if we already have Django?
- **Mid:** What are the responsibilities of a serializer vs a view?

← [DRF topic index](README.md)
