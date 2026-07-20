# Typing API Data

**Topic:** TypeScript · **Level:** Intermediate

## 1. The idea in one sentence

> Describe the JSON your API returns as TypeScript types, so every component that
> touches that data is checked against reality.

## 2. Our API types

[`web/src/lib/types.ts`](../../web/src/lib/types.ts) mirrors the DRF serializers:

```ts
export interface ArticleListItem {
  id: number; title: string; slug: string;
  author: AuthorMini; category: Category;
  featured_image: string | null;   // nullable, like the API
  published_at: string | null;
  ...
}
export interface Article extends ArticleListItem { content: string; tags: Tag[]; ... }
```

Note `extends`: the full `Article` reuses every field of the list item and adds
more. And `string | null` models fields the API may omit — TypeScript then forces
you to handle the null (e.g. `mediaUrl` returns `null` for a missing image).

## 3. Generics: one envelope, many types

DRF wraps lists in `{ count, next, previous, results }`. We model it once:

```ts
export interface Paginated<T> {
  count: number; next: string | null; previous: string | null; results: T[];
}
```

Then reuse it: `Paginated<ArticleListItem>`, `Paginated<Category>`. `<T>` is a
placeholder the caller fills in — write the shape once, use it everywhere.

## 4. Where it pays off

`api.listArticles()` returns `Paginated<ArticleListItem>`, so `ArticleCard` knows
exactly what fields exist. Rename a field in the type and every stale usage lights
up red.

## 5. Production tip

You can **generate** these types from the backend's OpenAPI schema
(`/api/schema/`) instead of hand-writing them. We keep them explicit here so they
double as documentation.

## 6. Exercises

- **Beginner:** Add a `Video` interface matching the video serializer.
- **Intermediate:** Type an `api.listVideos()` returning `Paginated<Video>`.
- **Advanced:** Generate types from the OpenAPI schema and compare.

## 7. Interview questions

- **Junior:** Why type your API responses?
- **Mid:** What are generics? Give an example from this repo.
- **Senior:** Trade-offs of hand-written vs schema-generated API types?

← [TypeScript topic index](README.md)
