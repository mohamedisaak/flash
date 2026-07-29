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

## 5b. One dynamic route, many CMS pages

A common real use of dynamic segments: **editable static pages**. Instead of a
hardcoded file per page (About, Contact, Terms, Privacy), we have one route
[`app/(site)/pages/[key]/page.tsx`](../../web/src/app/(site)/pages/[key]/page.tsx)
that looks the `key` up in the CMS:

```tsx
const { key } = await params;             // "about", "contact", …
const page = await api.getStaticPage(key);
if (!page) notFound();                     // unknown key OR admin set it "Hide"
```

Editors change the title/body in the dashboard's *Pages* section and it updates
here on ISR — no redeploy. `generateStaticParams` pre-renders the known keys for
speed. The lesson: when N pages share a shape and differ only in *data*, prefer
one data-driven dynamic route over N near-identical files. (This replaced an
early bug where About/FAQ/Contact all hardcoded `href="/about"` and rendered the
same file.)

## 6. Common mistakes

- Forgetting to `await params` in Next 16 → type errors / undefined values.
- Expecting `/articles` to be swallowed by `[category]` (it isn't — specificity
  wins).
- Returning `200` for missing content instead of calling `notFound()`.
- Hardcoding a page per nav link (and pointing several at the same URL) when they
  should be one CMS-driven dynamic route.

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
