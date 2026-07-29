# 20 · Expo

**Status:** 🟢 Built — see [`mobile/`](../../mobile/).

**Expo** is the batteries-included toolchain for React Native: a dev server, a
phone app (**Expo Go**) to preview instantly, prebuilt native modules
(`expo-image`, `expo-router`, …), and cloud builds (EAS). You write JS/TS; Expo
handles the native plumbing.

## 1. Running the app

```bash
cd mobile && npm install
npx expo start        # then: i = iOS sim, a = Android emulator, or scan QR in Expo Go
```

The Metro bundler serves your JS to the device over the network and hot-reloads
on save. No Xcode/Android Studio needed for day-to-day work (only for custom
native code or store builds).

## 2. Expo Router: folders are screens

Expo Router brings **file-based routing** (like Next.js) to native. A file under
`src/app/` *is* a route:

```
src/app/
  _layout.tsx            → root: providers + the navigation Stack
  (tabs)/_layout.tsx     → a bottom Tab navigator
  (tabs)/index.tsx       → the "Home" tab            (route: /)
  (tabs)/search.tsx      → the "Search" tab          (route: /search)
  article/[slug].tsx     → article detail            (route: /article/:slug)
  category/[slug].tsx    → category screen           (route: /category/:slug)
```

- **`_layout.tsx`** wraps the routes below it — the root one mounts our providers
  and a `Stack`; the `(tabs)` one mounts a `Tabs` navigator.
- **`(tabs)`** is a *group*: the parentheses mean "organise these files without
  adding a URL segment." It's how Home/Search/etc. become tabs, not `/tabs/...`.
- **`[slug]`** is a dynamic segment, read with `useLocalSearchParams`:

```tsx
// mobile/src/app/article/[slug].tsx
const { slug } = useLocalSearchParams<{ slug: string }>();
```

## 3. Navigating: `<Link>` and typed routes

We navigate with `<Link>` (declarative) using the **object form** so typed routes
stay type-safe:

```tsx
<Link href={{ pathname: "/article/[slug]", params: { slug: article.slug } }} asChild>
  <Pressable>…</Pressable>
</Link>
```

`asChild` makes the child (`Pressable`) the touch target instead of Link's own
wrapper. `app.json` enables `typedRoutes`, so a wrong pathname is a compile
error.

## 4. Config & environment

- **`app.json`** — app name, icon, splash, `scheme` (deep links), plugins.
- **`EXPO_PUBLIC_*` env vars** are inlined into the JS bundle at build time. We
  read `process.env.EXPO_PUBLIC_API_URL` in [`env.ts`](../../mobile/src/lib/env.ts)
  so the API host is configurable per environment (sim vs emulator vs a real
  phone on your LAN).

## 5. Native APIs, the easy way

Expo modules wrap native features with a JS API: `expo-image` (fast, cached
images), `expo-status-bar`, `expo-router`, and — if you extend Flash —
`expo-notifications` (push), `expo-av` (video), `expo-file-system` (offline
files). Add one with `npx expo install <name>` (it picks the version matching
your SDK).

## Exercises

- **Beginner:** Add a `(tabs)/videos.tsx` tab that lists `api.listVideos()`.
- **Intermediate:** Add a deep link so `mobile://article/<slug>` opens an article
  (hint: `scheme` in `app.json` + the existing route).
- **Advanced:** Wire `expo-notifications` to show a local notification when a new
  "breaking" article appears on refresh.

## Quiz

1. What does a folder named `(tabs)` do to the URL?
2. How do you read a `[slug]` route param?
3. Why must a browser-style `localhost` API URL be overridden for a real phone,
   and where is that done?

<details><summary>Answers</summary>

1. Nothing — parentheses group files for layout without adding a path segment.
2. `useLocalSearchParams<{ slug: string }>()`.
3. `localhost` is the phone itself; set `EXPO_PUBLIC_API_URL` (see `env.ts` /
   `.env.example`) to the dev machine's LAN IP.
</details>

← Back to the [curriculum index](../README.md)
