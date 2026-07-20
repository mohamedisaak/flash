# API Design

**Status:** 🟢 In progress

REST principles, HTTP, pagination/filtering, versioning, and documentation —
grounded in the Flash REST API built in Phase 2.

## Lessons

1. [REST & HTTP basics](01-rest-http-basics.md)
2. [REST & resources](02-rest-and-resources.md)
3. [Pagination, filtering & sorting](03-pagination-filtering-sorting.md)
4. [API versioning & documentation](04-versioning.md)

## Per-endpoint reference

The authoritative, always-current endpoint reference is the generated OpenAPI
docs at **`/api/docs/`** (Swagger) and **`/api/redoc/`** (ReDoc) when the server
is running — see [versioning & documentation](04-versioning.md). Because they're
generated from the code, they never go stale.

## Related

- Implementation details: [`../06-django-rest-framework/`](../06-django-rest-framework/README.md)
- Auth & permissions: [`../11-authentication/`](../11-authentication/README.md)

← Back to the [curriculum index](../README.md)
