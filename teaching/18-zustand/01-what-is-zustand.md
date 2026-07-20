# What is Zustand?

**Topic:** Zustand · **Level:** Intermediate

## 1. The idea in one sentence

> Zustand is a tiny state-management library: `create` returns a **hook** any
> component can call to read shared state or trigger actions — no provider, no
> boilerplate.

## 2. Why not React Context?

Context works, but every consumer re-renders when *any* part of the context value
changes, and you must wrap the tree in a provider. Zustand stores live outside
React; components subscribe to just the slice they use, so unrelated updates
don't re-render them.

## 3. In this project: the auth store

[`web/src/lib/auth-store.ts`](../../web/src/lib/auth-store.ts) holds the logged-in
user and auth status for the whole dashboard:

```ts
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  status: "loading",
  setUser: (user) => set({ user, status: user ? "authenticated" : "anonymous" }),
  logout: () => { clearTokens(); set({ user: null, status: "anonymous" }); },
}));
```

Any component reads what it needs:

```ts
const user = useAuthStore((s) => s.user);          // re-renders only if user changes
const logout = useAuthStore((s) => s.logout);
```

The **selector** `(s) => s.user` is the key: this component re-renders only when
`user` changes, not when unrelated state does.

## 4. State vs actions

The store holds both **state** (`user`, `status`) and **actions** (`setUser`,
`logout`) — functions that call `set(...)` to update. Keeping actions in the
store means the update logic lives in one place, not scattered across components.

## 5. Server vs client state

Zustand is for **client/UI state** (who's logged in, is a modal open). It is NOT
for server data — that's TanStack Query's job
([`../17-react-query/`](../17-react-query/README.md)). We use both: Zustand for
the session, TanStack Query for articles/categories.

## 6. Common mistakes

- Selecting the whole store (`useAuthStore()`) → re-renders on every change. Use a
  selector.
- Putting server data in Zustand and hand-syncing it → use TanStack Query.

## 7. Exercises

- **Beginner:** Add a `theme` value + `toggleTheme` action to a new store.
- **Intermediate:** Add a selector that returns `canPublish(user.role)`.
- **Advanced:** Persist the store to localStorage with Zustand's `persist`
  middleware and compare it to our manual token persistence.

## 8. Interview questions

- **Junior:** What does Zustand do?
- **Mid:** Why use a selector instead of reading the whole store?
- **Senior:** When do you reach for Zustand vs Context vs TanStack Query?

← [Zustand topic index](README.md)
