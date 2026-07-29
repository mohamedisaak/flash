# Flash — Mobile (Expo / React Native)

**Status:** 🟢 Phase 6 — MVP built.

The Flash news app for phones. It's a **second frontend** over the *same* Django
REST API the website uses — no separate backend. Built with **Expo Router**
(file-based navigation), **NativeWind** (Tailwind classes on native),
**TanStack Query** (data fetching/caching), and **AsyncStorage** (offline saves).

## Features

- **Home** — breaking banner, featured hero, latest feed (pull-to-refresh).
- **Categories** — browse sections → a category's latest articles.
- **Search** — the same full-text search API as the website.
- **Article** — hero image, body, **Save** (bookmark) and **Share**.
- **Saved** — bookmarked articles stored on-device, readable offline.

## Run it

```bash
# 1) Start the backend (from repo root)
cd backend && DJANGO_SETTINGS_MODULE=config.settings uv run python manage.py runserver 8000

# 2) Start the app
cd mobile && npm install        # first time only
npx expo start                  # press i (iOS), a (Android), or scan the QR in Expo Go
```

### Pointing at the API

`src/lib/env.ts` defaults to `localhost:8000` (iOS sim) / `10.0.2.2:8000`
(Android emulator). For a **physical phone**, copy `.env.example` to `.env` and
set `EXPO_PUBLIC_API_URL` to your computer's LAN IP (see that file). CORS is
already enabled on the backend.

## Layout

```
src/
  app/                     # Expo Router routes (file = screen)
    _layout.tsx            # providers (Query, SafeArea) + navigation stack
    (tabs)/                # Home · Categories · Search · Saved
    article/[slug].tsx     # article detail
    category/[slug].tsx    # a category's articles
  components/              # ArticleCard, HeroCard, BreakingBanner, StateView
  lib/                     # api.ts, types.ts, env.ts, utils.ts, bookmarks.ts
```

## Checks

```bash
npm run typecheck    # tsc --noEmit
npm run lint         # expo lint
npm run format       # prettier --write .   (format:check to verify)
npx expo export -p ios   # verify the bundle builds (no simulator needed)
```

## Conventions worth knowing

- **`src/lib/` mirrors the web app** (`api.ts`, `types.ts`, `env.ts`, `utils.ts`,
  `bookmarks.ts`) so concepts transfer between the two frontends. Keep the shapes
  in sync with the backend serializers.
- **Same API, no new backend.** All data comes from the Django REST API; there is
  no mobile-specific server.
- **Per-platform host** lives in `src/lib/env.ts`. Changing Wi-Fi changes your LAN
  IP — update `.env` (and the backend's `ALLOWED_HOSTS`) and restart Expo with
  `npx expo start -c` (env vars are baked at bundle start).
- **SDK is pinned** to match the Expo Go client's supported SDK (54). Don't bump
  Expo without checking the device's Expo Go version — see the run notes.

Learning material: [`teaching/19-react-native/`](../teaching/19-react-native/README.md),
[`20-expo/`](../teaching/20-expo/README.md), [`21-nativewind/`](../teaching/21-nativewind/README.md),
[`22-mobile-architecture/`](../teaching/22-mobile-architecture/README.md).
