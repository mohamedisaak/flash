# Server vs Client Components

**Topic:** Next.js · **Level:** Intermediate

## 1. The idea in one sentence

> In the App Router, components render **on the server by default**; you opt a
> component into the browser with `"use client"` only when it needs
> interactivity.

## 2. The mental model

| | Server Component (default) | Client Component (`"use client"`) |
|--|----------------------------|-----------------------------------|
| Runs | on the server, at render | in the browser |
| Can | fetch data, read secrets, query APIs directly | use state, effects, events, browser APIs |
| Ships JS to browser? | **no** | yes |
| Examples here | `page.tsx`, `SiteHeader`, `ArticleCard` | `SearchBox`, `SearchResults`, `Providers` |

Default to Server Components (less JS, better SEO). Reach for a Client Component
only when you need `useState`, `onClick`, `useEffect`, or browser-only APIs.

## 3. In this project

**Server** — the header fetches categories directly during render
([`components/site-header.tsx`](../../web/src/components/site-header.tsx)):

```tsx
export async function SiteHeader() {
  const categories = await api.listCategories();   // runs on the server
  ...
}
```

No API key is exposed, and the nav is in the initial HTML.

**Client** — the search box needs state + the router
([`components/search-box.tsx`](../../web/src/components/search-box.tsx)):

```tsx
"use client";
export function SearchBox() {
  const [q, setQ] = useState("");   // browser-only
  ...
}
```

## 4. They compose

A Server Component can render a Client Component (the server sends HTML, the
client "hydrates" the interactive bits). Our server `layout.tsx` renders the
client `<Providers>` and `<SiteHeader>` renders the client `<SearchBox>`. You
can't go the other way and import a Server Component *into* a client one — pass
it as `children` instead.

## 5. Common mistakes

- Adding `"use client"` to everything → ships needless JS, hurts performance.
- Calling `useState`/`onClick` in a Server Component → error; it needs
  `"use client"`.
- Trying to read a server secret in a Client Component → it would leak to the
  browser. Keep secrets in Server Components.

## 6. Exercises

- **Beginner:** List which components in `web/src` are client vs server, and why.
- **Intermediate:** Convert `SiteFooter` to fetch something on the server.
- **Advanced:** Explain why `Providers` must be a Client Component.

## 7. Interview questions

- **Junior:** What does `"use client"` do?
- **Mid:** Why default to Server Components?
- **Senior:** How do server and client components compose, and what are the
  boundary rules?

← [Next.js topic index](README.md)
