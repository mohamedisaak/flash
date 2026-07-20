# useQuery

**Topic:** TanStack Query · **Level:** Intermediate

## 1. The hook

[`web/src/components/search-results.tsx`](../../web/src/components/search-results.tsx):

```tsx
const { data, isPending, isError } = useQuery({
  queryKey: ["search", q],
  queryFn: () => fetchSearch(q),
  enabled: q.length > 0,
});
```

- **`queryKey`** — a unique id for this query's cache entry. Because it includes
  `q`, each search term is cached separately; re-typing a past query is instant.
- **`queryFn`** — the async function that fetches the data.
- **`enabled`** — don't run for an empty query.
- **returns** — `data`, plus status booleans (`isPending`, `isError`, `isSuccess`)
  you branch on to render loading/error/results.

## 2. The status pattern

```tsx
if (isPending) return <Spinner/>;
if (isError)   return <Error/>;
return <Results data={data}/>;
```

No manual `useState` for loading/error — the hook tracks it.

## 3. Caching by key

The `queryKey` is the cache identity. Search "kenya", then "weather", then
"kenya" again → the third render is served from cache instantly, no refetch
(until `staleTime` expires). This is the big win over DIY fetching.

## 4. Common mistakes

- Unstable/incomplete `queryKey` (e.g. omitting `q`) → wrong cache hits.
- Doing side effects in `queryFn` — keep it a pure fetch.
- Forgetting `enabled` → firing requests for empty/invalid input.

## 5. Exercises

- **Beginner:** Show the result `count` while loading a *previous* query
  (`placeholderData`).
- **Intermediate:** Add an autocomplete `useQuery` hitting
  `/search/autocomplete/`.
- **Advanced:** Add pagination via `useInfiniteQuery` and a "load more" button.

## 6. Interview questions

- **Junior:** What does `useQuery` return?
- **Mid:** What is the `queryKey` for?
- **Senior:** How does caching-by-key enable instant back/forward and dedup?

← [TanStack Query topic index](README.md)
