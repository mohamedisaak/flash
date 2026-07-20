# Routing & Params (App Router)

**Topic:** Next.js · **Level:** Beginner → Intermediate

## 1. Folders are routes

In the App Router, the `app/` folder structure *is* the URL structure. A
`page.tsx` inside a folder makes that folder a page:

```text
app/page.tsx              →  /
app/search/page.tsx       →  /search
app/articles/[slug]/page.tsx  →  /articles/anything
app/[category]/page.tsx   →  /anything
```

`[slug]` and `[category]` are **dynamic segments** — placeholders that match any
value and hand it to the page as a param.

## 2. Reading params (Next 16: they're Promises)

In Next 16, `params` and `searchParams` are **Promises** you `await`:

```tsx
type PageProps = { params: Promise<{ slug: string }> };

export default async function ArticlePage({ params }: PageProps) {
  const { slug } = await params;
  ...
}
```

The search page reads a query string the same way:

```tsx
type PageProps = { searchParams: Promise<{ q?: string }> };
const { q = "" } = await searchParams;
```

## 3. Precedence: static beats dynamic

We have both `app/articles/[slug]` and a root `app/[category]`. Won't `/articles`
match `[category]`? No — Next matches **more specific routes first**. Explicit
segments (`/articles`, `/search`) win; only leftover top-level slugs (`/politics`)
fall through to `[category]`. That's deliberate: it mirrors the backend sitemap's
`/{slug}` category URLs.

## 4. Linking & navigating

- `<Link href="/articles/x">` — client-side navigation, no full reload
  ([`article-card.tsx`](../../web/src/components/article-card.tsx)).
- `useRouter().push(...)` — programmatic navigation from an event
  ([`search-box.tsx`](../../web/src/components/search-box.tsx)).

## 5. `notFound()` and `not-found.tsx`

When an article doesn't exist, the page calls `notFound()`, which renders
[`app/not-found.tsx`](../../web/src/app/not-found.tsx) and returns a real 404
status — important so search engines don't index missing pages.

## 6. Common mistakes

- Forgetting to `await params` in Next 16 → type errors / undefined values.
- Expecting `/articles` to be swallowed by `[category]` (it isn't — specificity
  wins).
- Returning `200` for missing content instead of calling `notFound()`.

## 7. Exercises

- **Beginner:** Add an `app/about/page.tsx` and visit `/about`.
- **Intermediate:** Add `/authors/[id]/page.tsx` listing an author's articles.
- **Advanced:** Explain what happens if you create both `app/politics/page.tsx`
  and rely on `app/[category]` for "politics".

## 8. Interview questions

- **Junior:** How does file-based routing work?
- **Mid:** What are dynamic segments and how do you read their values?
- **Senior:** How does route specificity resolve overlaps like `/articles` vs
  `/[category]`?

← [Next.js topic index](README.md)
