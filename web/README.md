# Flash — Web (Next.js 16)

The public news website, built with **Next.js 16 (App Router)**, React 19,
TypeScript, Tailwind CSS v4, and TanStack Query. It consumes the Django REST API.

> **Scope:** Phase 5 delivers the **public site** (home, article, category,
> search) — the SEO-critical surface. The editorial/admin and author dashboards
> are a follow-on (Phase 5b). See [`../PLAN.md`](../PLAN.md).

## Stack

- Next.js 16 App Router · React 19 · TypeScript 5
- Tailwind CSS v4 (CSS-first config) + shadcn-style owned components
- TanStack Query (client-side data for search)

## Pages

| Route | Rendering | Notes |
|-------|-----------|-------|
| `/` | ISR (60s) | latest stories |
| `/articles/[slug]` | ISR (300s) | `generateMetadata` + JSON-LD (NewsArticle) |
| `/[category]` | ISR (120s) | section pages, matches backend sitemap `/{slug}` |
| `/search?q=` | client (TanStack Query) | `noindex`; hits `/api/v1/search/` |

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
pnpm build        # production build
```

## How data flows

Server Components fetch from the API on the server (see `src/lib/api.ts`) using
Next's `revalidate` for ISR. The interactive search page fetches in the browser
with TanStack Query. SEO metadata and JSON-LD come from the article's own fields
and the backend's `/api/v1/seo/` endpoints.

Learning material: [`teaching/12-nextjs/`](../teaching/12-nextjs/README.md) and
the React/TypeScript/Tailwind/shadcn/TanStack Query topics.
