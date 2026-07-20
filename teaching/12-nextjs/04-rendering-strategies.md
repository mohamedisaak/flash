# Rendering Strategies: SSR, SSG, ISR

**Topic:** Next.js · **Level:** Intermediate

## 1. The three strategies

| Strategy | When HTML is built | Best for | Freshness |
|----------|--------------------|----------|-----------|
| **SSG** (Static) | at build time | pages that rarely change | stale until rebuild |
| **SSR** (Server-side) | on every request | highly dynamic/personalized | always fresh, slower |
| **ISR** (Incremental Static Regeneration) | at build, then re-built in the background on a timer | news! | fast *and* fresh |

## 2. Why ISR is perfect for news

A news homepage must be **fast** (millions of readers) *and* **fresh** (new
stories constantly). ISR gives both: serve a cached static page, and rebuild it
at most once every N seconds. Readers get static-page speed; the page is never
more than N seconds stale.

## 3. How we choose per route

You set `revalidate` (seconds) in a route. From
[`web/src/app/page.tsx`](../../web/src/app/page.tsx):

```tsx
export const revalidate = 60;   // home: rebuild at most once a minute
```

Our choices:

| Route | `revalidate` | Reason |
|-------|-------------|--------|
| `/` (home) | 60s | new stories appear fast |
| `/articles/[slug]` | 300s | an article changes rarely once published |
| `/[category]` | 120s | section feeds update steadily |
| `/search` | — (client) | interactive, per-query; not cached as a page |

The build output labels each route `○ (Static)` or `ƒ (Dynamic)` so you can
verify what you got.

## 4. Data-fetch level revalidation

`revalidate` also works per-fetch. Our API client
([`web/src/lib/api.ts`](../../web/src/lib/api.ts)) passes it to `fetch`:

```ts
fetch(url, { next: { revalidate: 60 } });
```

Next dedupes and caches these fetches, so ISR "just works" from Server
Components.

## 5. Build-safety

During `next build`, static/ISR pages are prerendered — which means fetching
data. If the backend is down, our client catches the error and returns empty, so
the build still succeeds (the page shows an empty state). Never let a flaky
dependency break the build.

## 6. Common mistakes

- Making everything SSR → slow, expensive, misses caching wins.
- Pure SSG for news → stale until you redeploy.
- Forgetting that a `revalidate` window means data can be up to N seconds old.

## 7. Exercises

- **Beginner:** What does `export const revalidate = 60` do?
- **Intermediate:** Change the article revalidate to 30s; rebuild and read the
  route table.
- **Advanced:** When would you use `revalidateTag`/on-demand revalidation
  instead of a timer (e.g. re-publish an article)?

## 8. Interview questions

- **Junior:** Difference between SSR, SSG, and ISR?
- **Mid:** Why is ISR ideal for a news site?
- **Senior:** How does on-demand revalidation complement time-based ISR?

← [Next.js topic index](README.md)
