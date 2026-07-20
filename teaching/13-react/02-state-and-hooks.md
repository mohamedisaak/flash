# State & Hooks

**Topic:** React · **Level:** Beginner → Intermediate

## 1. The idea in one sentence

> **State** is data that changes over time and causes the UI to re-render;
> **hooks** (functions starting with `use`) let a component use state and other
> React features.

## 2. `useState`

From [`web/src/components/search-box.tsx`](../../web/src/components/search-box.tsx):

```tsx
const [q, setQ] = useState("");        // q = current value, setQ = updater
<input value={q} onChange={(e) => setQ(e.target.value)} />
```

Calling `setQ(...)` re-renders the component with the new value. This is a
**controlled input**: React state is the single source of truth for the field.

## 3. Rules of hooks

- Only call hooks at the **top level** of a component (never in loops/ifs).
- Only call them in **Client Components** (`"use client"`) — hooks are
  browser-side. That's why `SearchBox` has the directive.

## 4. Other hooks you'll meet

| Hook | Purpose | Used in |
|------|---------|---------|
| `useState` | local state | `SearchBox` |
| `useRouter` | programmatic navigation | `SearchBox` |
| `useQuery` | fetch + cache server data | `SearchResults` (TanStack Query) |

## 5. Common mistakes

- Mutating state directly (`q = "x"`) instead of `setQ("x")` → no re-render.
- Using a hook in a Server Component → error; add `"use client"` or move the
  logic.

## 6. Exercises

- **Beginner:** Add a "clear" button that calls `setQ("")`.
- **Intermediate:** Disable the submit when `q` is empty.
- **Advanced:** Debounce the input so navigation waits 300ms after typing stops.

## 7. Interview questions

- **Junior:** What is state? What does `useState` return?
- **Mid:** What are the rules of hooks?
- **Senior:** Controlled vs uncontrolled inputs — trade-offs?

← [React topic index](README.md)
