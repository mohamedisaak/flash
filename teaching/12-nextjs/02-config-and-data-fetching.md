# Config & Data Fetching

**Topic:** Next.js · **Level:** Intermediate

## 1. The idea in one sentence

> Server Components fetch data by just calling `fetch` (or our API client) during
> render — no `useEffect`, no loading spinner for the initial page.

## 2. Environment config in one place

We read env vars through a single typed module
([`web/src/lib/env.ts`](../../web/src/lib/env.ts)) so nothing else touches
`process.env` directly:

```ts
export const env = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1",
  backendOrigin: process.env.NEXT_PUBLIC_BACKEND_ORIGIN ?? "http://localhost:8000",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
};
```

`NEXT_PUBLIC_*` vars are exposed to the browser; anything else stays server-only.
Our API is public-read, so exposing its URL is fine.

## 3. The build-safe API client

[`web/src/lib/api.ts`](../../web/src/lib/api.ts) centralizes every backend call.
The core helper never throws:

```ts
async function getJson<T>(path, opts): Promise<T | null> {
  try {
    const res = await fetch(url, { next: { revalidate: opts.revalidate ?? 60 } });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;   // backend down (e.g. offline build) → graceful fallback
  }
}
```

Callers default the result (`?? EMPTY_PAGE`), so a missing backend renders an
empty state instead of crashing. This is why `next build` works even without the
API running.

## 4. Fetching in a Server Component

```tsx
export default async function HomePage() {
  const { results } = await api.listArticles({ page_size: 13 });
  return <Feed articles={results} />;
}
```

The component is `async`; it awaits data on the server; the HTML ships complete.
No client-side loading state for the first render.

## 5. Server fetch vs client fetch

- **Server** (pages, cards, header) → the API client + Next's `fetch` cache/ISR.
- **Client** (search) → TanStack Query in the browser (see
  [`../17-react-query/`](../17-react-query/README.md)).

Use the server path for initial content (fast, SEO-friendly); use the client path
for interactive, per-user data.

## 6. Common mistakes

- Fetching initial page data in a `useEffect` (client) → blank page for crawlers,
  slower first paint. Fetch on the server.
- Scattering `process.env` reads everywhere → hard to change/rename.
- Letting a failed fetch crash the render/build instead of degrading.

## 7. Exercises

- **Beginner:** Add a `trending` fetch to the home page using
  `api.listArticles({ ordering: "-views" })`.
- **Intermediate:** Add a new typed method to `api.ts` for videos.
- **Advanced:** Explain how Next dedupes two identical `fetch`es in one render.

## 8. Interview questions

- **Junior:** How does a Server Component get its data?
- **Mid:** Why centralize env access and the API client?
- **Senior:** How would you make the API client resilient to partial backend
  outages in production?

← [Next.js topic index](README.md)
