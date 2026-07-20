# QuerySet Scoping (showing the right rows to the right people)

**Topic:** Django REST Framework · **Level:** Intermediate

## 1. The idea in one sentence

> `get_queryset()` decides **which rows** an endpoint can see — the single most
> important place to prevent data leaks.

## 2. Why it matters

A list endpoint returns "all articles" — but *should* an anonymous reader see
unpublished drafts? Should you see *other people's* notifications? The answer
lives in `get_queryset()`. Get it wrong and you leak private data.

## 3. Public vs staff (articles)

[`apps/articles/views.py`](../../backend/apps/articles/views.py):

```python
def get_queryset(self):
    related = ("author", "category")
    user = self.request.user
    if user.is_authenticated and user.is_editorial_staff:
        return Article.objects.select_related(*related).prefetch_related("tags")
    return Article.published.select_related(*related).prefetch_related("tags")
```

Newsroom staff see everything; everyone else sees only live articles — enforced
in one place via the `published` manager. No draft can leak because the query
itself never selects it.

## 4. Owner-scoping (notifications)

[`apps/notifications/views.py`](../../backend/apps/notifications/views.py):

```python
def get_queryset(self):
    if getattr(self, "swagger_fake_view", False):
        return Notification.objects.none()
    return Notification.objects.filter(recipient=self.request.user)
```

A user can only ever query their own notifications — there's no way to pass an id
for someone else's, because those rows aren't in the queryset. (The
`swagger_fake_view` guard returns nothing during schema generation, when there's
no real logged-in user.)

## 5. `select_related` / `prefetch_related` (avoid N+1)

Listing 20 articles that each show their author and category could fire 1 + 20 +
20 queries. `select_related("author", "category")` (for FKs) and
`prefetch_related("tags")` (for M2M) collapse that into a handful. Scoping is
about *correctness*; prefetching is about *performance* — do both here.

## 6. Common mistakes

- Filtering by owner in the serializer or the frontend instead of the queryset →
  the data still leaves the database; anyone crafting a request can reach it.
- Forgetting the `swagger_fake_view` guard when `get_queryset` uses
  `request.user` → schema generation crashes on `AnonymousUser`.

## 7. Exercises

- **Beginner:** What does an anonymous user get from `GET /api/v1/articles/`?
- **Intermediate:** Write the comments `get_queryset` rule in words (hint:
  approved-only for the public, full queue for moderators).
- **Advanced:** Add `select_related` to a viewset and use `django-debug-toolbar`
  (or `assertNumQueries`) to prove the query count dropped.

## 8. Interview questions

- **Junior:** Where should "only show my own data" be enforced and why?
- **Mid:** What's the N+1 problem and how do `select_related`/`prefetch_related`
  fix it?
- **Senior:** Compare queryset scoping vs object-level permissions for
  multi-tenant data isolation.

← [DRF topic index](README.md)
