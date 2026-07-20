# ViewSets & Routers

**Topic:** Django REST Framework · **Level:** Beginner → Intermediate

## 1. The idea in one sentence

> A **ViewSet** groups all the actions for one resource (list, create, retrieve,
> update, delete) into a single class; a **Router** turns that class into all the
> matching URLs automatically.

## 2. Analogy

A ViewSet is a **department that handles everything about one topic** (all
article requests). The Router is the **receptionist** who knows which desk
(method) each visitor (URL + HTTP verb) should go to.

## 3. The mapping

A `ModelViewSet` gives you these for free:

| HTTP + URL | Action | Result |
|-----------|--------|--------|
| `GET /articles/` | list | page of articles |
| `POST /articles/` | create | new article |
| `GET /articles/{slug}/` | retrieve | one article |
| `PUT/PATCH /articles/{slug}/` | update | edit |
| `DELETE /articles/{slug}/` | destroy | delete |

## 4. In this project

[`apps/categories/views.py`](../../backend/apps/categories/views.py):

```python
class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [ReadOnlyOrEditorialStaff]
    lookup_field = "slug"                 # URLs use the slug, not the id
    filterset_fields = ["is_active", "parent"]
    search_fields = ["name", "description"]
    ordering_fields = ["order", "name", "created_at"]
```

And the router in [`apps/categories/urls.py`](../../backend/apps/categories/urls.py):

```python
router = DefaultRouter()
router.register("categories", CategoryViewSet)
router.register("tags", TagViewSet)
urlpatterns = router.urls
```

Two lines of registration produced ~8 URLs.

## 5. Custom actions with `@action`

Beyond the standard five, you can add named endpoints. From the article viewset:

```python
@action(detail=True, methods=["post"], permission_classes=[AllowAny], url_path="view")
def register_view(self, request, slug=None):
    Article.objects.filter(slug=slug).update(views=F("views") + 1)
    return Response({"status": "ok"})
```

`detail=True` means it operates on one object → `POST /articles/{slug}/view/`.
`detail=False` would be a collection-level action (e.g. `mark-all-read`).

## 6. Per-action permissions & serializers

Override `get_permissions()` or `get_serializer_class()` to vary behavior by
action — e.g. the live-updates viewset allows anyone to read but only staff to
post, and the article viewset returns the light serializer for `list` and the
full one otherwise.

## 7. Common mistakes

- No `queryset` attribute **and** no `basename` in `router.register` → the router
  can't infer a name and errors. (We pass `basename` where `get_queryset` is
  dynamic.)
- Putting business logic in the view that belongs in a service/model method.

## 8. Exercises

- **Beginner:** List every URL the article router generates.
- **Intermediate:** Add a `@action(detail=False)` called `featured` returning
  only featured articles.
- **Advanced:** Explain why `register_view` uses `F("views") + 1` instead of
  reading, incrementing in Python, and saving.

## 9. Interview questions

- **Junior:** What does a router do?
- **Mid:** When would you use a `@action` vs a separate view?
- **Senior:** How do you keep viewsets thin as business rules grow?

← [DRF topic index](README.md)
