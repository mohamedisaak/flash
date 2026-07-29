# Flash — Web (Next.js 16)

The public news website, built with **Next.js 16 (App Router)**, React 19,
TypeScript, Tailwind CSS v4, and TanStack Query. It consumes the Django REST API.

Includes both the **public site** and the **editorial/author dashboards**.

## Stack

- Next.js 16 App Router · React 19 · TypeScript 5
- Tailwind CSS v4 (CSS-first config) + shadcn-style owned components
- TanStack Query (client data) · Zustand (auth session)
- React Hook Form + Zod (forms) · Tiptap (rich-text editor)

## Pages

**Public site**

| Route              | Rendering               | Notes                                            |
| ------------------ | ----------------------- | ------------------------------------------------ |
| `/`                | ISR (60s)               | latest stories                                   |
| `/articles/[slug]` | ISR (300s)              | `generateMetadata` + JSON-LD (NewsArticle)       |
| `/[category]`      | ISR (120s)              | section pages, matches backend sitemap `/{slug}` |
| `/search?q=`       | client (TanStack Query) | `noindex`; hits `/api/v1/search/`                |

**Dashboard** (JWT-authenticated, `noindex`)

| Route                                                         | Purpose                                |
| ------------------------------------------------------------- | -------------------------------------- |
| `/dashboard/login`                                            | JWT sign-in                            |
| `/dashboard`                                                  | overview: stat tiles + recent articles |
| `/dashboard/articles`                                         | manage articles (role-scoped)          |
| `/dashboard/articles/new` · `/dashboard/articles/[slug]/edit` | create/edit with Tiptap + RHF + Zod    |

## Getting started

```bash
cd web
cp .env.example .env.local          # point NEXT_PUBLIC_API_URL at the backend
pnpm install                        # or npm install
pnpm dev                            # http://localhost:3000
```

The backend must be running (`http://localhost:8000`) with some published
articles for data to appear — otherwise pages render empty states (the API
client is build-safe and never crashes on a missing backend).

## Checks

```bash
pnpm typecheck    # tsc --noEmit
pnpm lint         # eslint (Next core-web-vitals + TS rules)
pnpm format       # prettier --write .   (format:check to verify)
pnpm build        # production build
```

## How data flows

Server Components fetch from the API on the server (see `src/lib/api.ts`) using
Next's `revalidate` for ISR. The interactive search page fetches in the browser
with TanStack Query. SEO metadata and JSON-LD come from the article's own fields
and the backend's `/api/v1/seo/` endpoints.

## Project structure

```text
src/
  app/
    (site)/          Public site route group (header/footer chrome, ISR pages)
    dashboard/(app)/ Editorial/admin dashboard (JWT-gated, full-screen chrome)
    layout.tsx       Minimal root layout (injects theme vars from SiteSettings)
  components/
    public/          Public-site components (Ad, SectionBlock, trackers, …)
    dashboard/       Dashboard shell + the config-driven CRUD system (crud/)
    ui/              Small shared primitives (Badge, …)
  lib/
    api.ts           Public, build-safe server fetch client (ISR revalidate)
    auth-api.ts      Authenticated client: resource()/singleton()/apiRequest()
    auth-store.ts    Zustand JWT session + token helpers
    *-api.ts         Feature clients (analytics, ingestion) over auth-api
    types.ts         Shared API response types
    utils.ts         Formatting, media URLs, safe-colour helpers
```

## Conventions worth knowing

- **Two API layers.** Public server components use `lib/api.ts` (no auth,
  returns empty/`null` on failure so a down backend never breaks a build).
  Dashboard code uses `lib/auth-api.ts`, which attaches + refreshes the JWT.
- **Config-driven CRUD.** Most dashboard sections are a few lines of field/column
  config on top of `components/dashboard/crud/CrudSection` — see
  `dashboard/(app)/ads/page.tsx` for the pattern. Prefer extending it over
  hand-rolling a new table+form.
- **Caching is explicit per call.** Each `api.ts` method passes its own
  `revalidate` (ISR window). Short windows (15–120s) for admin-editable content
  (ads, settings, categories, static pages) so edits show quickly; longer for
  stable data. **A content edit not appearing is almost always this cache** — the
  running dev server also holds fetches in memory, so restart `pnpm dev` to force
  a refresh.
- **Brand colours** come from `SiteSettings` as `--color-brand` / `--color-accent`
  CSS vars; Tailwind utilities (`bg-brand`, `stroke-accent`, …) read them.
- **First-party analytics/ads** are instrumented client-side (see
  `components/public/page-view-tracker.tsx` and `ad-tracking.tsx`); logged-in
  staff are excluded server-side.

Learning material: [`teaching/12-nextjs/`](../teaching/12-nextjs/README.md) and
the React/TypeScript/Tailwind/shadcn/TanStack Query topics.
