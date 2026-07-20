# Serializers

**Topic:** Django REST Framework · **Level:** Beginner → Intermediate

## 1. The idea in one sentence

> A serializer is a **two-way translator**: models → JSON for responses, and
> incoming JSON → validated data for writes.

## 2. Analogy

A serializer is a **customs officer** at the border between your Python world and
the outside JSON world. Going out, it packages objects into JSON. Coming in, it
inspects the JSON, rejects anything invalid, and only lets clean data through.

## 3. A basic `ModelSerializer`

```python
class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ["id", "name", "slug"]
        read_only_fields = ["slug"]
```

`ModelSerializer` reads your model and builds the fields for you. `fields` is an
explicit allow-list (never use `"__all__"` in real projects — it leaks columns).
`read_only_fields` are returned but can't be set by the client.

Real file: [`apps/categories/serializers.py`](../../backend/apps/categories/serializers.py).

## 4. Write-only fields (never leak secrets)

From [`apps/accounts/serializers.py`](../../backend/apps/accounts/serializers.py):

```python
password = serializers.CharField(write_only=True, validators=[validate_password])

def create(self, validated_data):
    return User.objects.create_user(**validated_data)  # hashes the password
```

`write_only=True` means the password can come *in* but never goes *out*. We also
run Django's password validators and use `create_user` so it's hashed.

## 5. Read rich, write by id (a very common pattern)

Clients like to *read* nested objects but *write* by id. See the article
serializer ([`apps/articles/serializers.py`](../../backend/apps/articles/serializers.py)):

```python
category = CategorySerializer(read_only=True)                      # nested on read
category_id = serializers.PrimaryKeyRelatedField(                  # id on write
    source="category", queryset=Category.objects.all(), write_only=True
)
```

So a GET returns the whole category object, but a POST just sends
`"category_id": 3`.

## 6. List vs detail serializers

Articles use **two** serializers: a slim `ArticleListSerializer` (no huge
`content` field) for feeds, and a full `ArticleDetailSerializer` for one article.
List responses stay small and fast — an important API habit.

## 7. `SerializerMethodField` for computed values

```python
latest_updates = serializers.SerializerMethodField()

@extend_schema_field(LiveBlogUpdateSerializer(many=True))
def get_latest_updates(self, obj):
    return LiveBlogUpdateSerializer(obj.updates.all()[:5], many=True).data
```

Use it for values you compute rather than store. The `@extend_schema_field`
decorator tells the OpenAPI generator what type it returns (otherwise it guesses
"string").

## 8. Common mistakes

- `fields = "__all__"` → accidentally exposes sensitive columns.
- Forgetting `write_only` on passwords/tokens → they appear in responses.
- Doing heavy queries inside a `SerializerMethodField` for every row in a list →
  N+1 queries. Prefetch in the view instead.

## 9. Exercises

- **Beginner:** Add a `word_count` read-only `SerializerMethodField` to the
  article detail serializer.
- **Intermediate:** Explain why `category_id` uses `source="category"`.
- **Advanced:** The list serializer omits `content`. Measure the response-size
  difference against the detail serializer for a long article.

## 10. Interview questions

- **Junior:** What does a serializer do?
- **Mid:** Difference between `read_only`, `write_only`, and a normal field?
- **Senior:** How do serializers cause N+1 queries and how do you prevent them?

← [DRF topic index](README.md)
