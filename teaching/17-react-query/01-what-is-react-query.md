# What is TanStack Query?

**Topic:** TanStack Query · **Level:** Intermediate

## 1. The idea in one sentence

> TanStack Query (React Query) manages **server state on the client** — fetching,
> caching, and refreshing API data — so you don't hand-roll loading/error state
> and manual caches.

## 2. Server state is different

Data from an API isn't really "your" state — it lives on the server and can go
stale. TanStack Query treats it as a **cache** you keep in sync: it remembers
results, dedupes requests, and refetches when needed.

## 3. Why not just `useEffect` + `fetch`?

The DIY approach means writing loading flags, error handling, cancellation, and
caching by hand — for every screen. TanStack Query gives all of that in a few
lines, consistently.

## 4. In this project

Server Components handle the *initial* page (fast, SEO). TanStack Query handles
*interactive* data — the search page, which fetches per keystroke-driven query in
the browser. It's set up in
[`web/src/app/providers.tsx`](../../web/src/app/providers.tsx):

```tsx
const [client] = useState(() => new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, refetchOnWindowFocus: false } },
}));
<QueryClientProvider client={client}>{children}</QueryClientProvider>
```

`staleTime: 30s` means results are considered fresh for 30 seconds before a
refetch is even considered.

## 5. When to use which

| Need | Use |
|------|-----|
| Initial page content, SEO | Server Component fetch |
| Interactive / per-user / frequently-refreshed data | TanStack Query |

## 6. Interview questions

- **Junior:** What problem does TanStack Query solve?
- **Mid:** What is "server state" and why treat it as a cache?
- **Senior:** How do Server Components and TanStack Query divide responsibilities?

← [TanStack Query topic index](README.md)
