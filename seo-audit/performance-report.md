# Performance / Core Web Vitals Report

The app was already built on a fast foundation (Next 16 App Router, RSC, ISR,
`next/image`, system fonts). This audit made **SEO** changes that are
performance-neutral-to-positive (all new structured data is tiny inline JSON;
sitemaps/feeds are cached route handlers). No render-blocking resources were
added. Below is the CWV-relevant assessment and the concrete wins/opportunities.

---

## Already-good foundations (verified, no change needed)

| Area | Finding |
|---|---|
| **Fonts** | `--font-sans` is a **system stack** (`ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto…`). Zero web-font downloads → no FOIT/FOUT, no render-blocking font CSS, no layout shift from font swap. This is optimal for LCP/CLS. |
| **Images** | All use `next/image` (automatic responsive `srcset`, lazy by default, modern formats via the optimizer). The article hero uses `priority` (good LCP) and every image sets `sizes` and uses `fill` with an aspect-ratio box → **no CLS** from images. |
| **Rendering** | Public pages are **Server Components with ISR** (`revalidate` 15–3600s). HTML is prerendered/cached, so TTFB and FCP are strong; minimal client JS. |
| **Analytics** | GA loads via `next/script` with `strategy="afterInteractive"` — not render-blocking, and only when a valid GA ID is configured. |
| **Data fetching** | Server-side fetches are parallelized with `Promise.all`; TanStack Query on the client uses `refetchOnWindowFocus:false` + `staleTime` (no refetch storms). |
| **Security headers** | CSP + `X-Content-Type-Options`, `Referrer-Policy`, `X-DNS-Prefetch-Control: on` already set in `next.config.ts`. |

---

## Changes made in this audit (performance impact)

| Change | CWV impact |
|---|---|
| Added `viewport` with `width=device-width, initial-scale=1` + theme-color | Prevents mobile zoom/reflow; theme-color improves perceived Page Experience |
| Inline JSON-LD (WebSite/Org/Breadcrumb/etc.) | Negligible bytes; no blocking; parsed off the critical path |
| Sitemap/news/RSS as **cached** route handlers (`revalidate` 3600/300/600 + `Cache-Control` s-maxage) | Served from cache; no per-request DB load; no page-render impact |
| `permanentRedirect` for `/about` | 308 cached by browsers/CDN → faster repeat resolution than 307 |
| Removed accidental global canonical | Prevents mass-canonicalization bug (correctness, not perf) |

**Net JS bundle change: none** — no new client components; `lib/seo.ts` and the
route handlers are server-only.

---

## Core Web Vitals targets & levers

| Metric | Current posture | Lever if needed |
|---|---|---|
| **LCP** | Hero image `priority` + ISR HTML | Ensure the CMS serves appropriately sized featured images; add a real production CDN host to `images.remotePatterns` |
| **CLS** | Aspect-ratio boxes on all images; system fonts | Reserve space for the ad slots (`components/public/ad`) to avoid shift when ads load |
| **INP** | Minimal client JS (RSC) | Keep third-party scripts to GA only; avoid heavy client hydration |
| **FCP/TTFB** | Prerendered + ISR | Add edge/CDN caching of HTML in production (infra) |

---

## Opportunities (not applied — infra or product)

1. **Ad slot reservation (CLS):** `components/public/ad.tsx` renders
   admin-configured banners; give each placement a fixed min-height so late-
   loading creatives don't shift content. *Frontend, low-risk — deferred as it
   touches visible layout (out of "don't redesign" scope; flagged).*
2. **Production image host:** add the real media/CDN hostname to
   `next.config.ts` `images.remotePatterns` before launch (dev only whitelists
   localhost). Without it, production images won't be optimized.
3. **HTML CDN + Brotli:** ensure nginx/CDN sends `Cache-Control` and Brotli for
   HTML/JSON (infra).
4. **`opengraph-image` via `ImageResponse`:** dynamic branded social cards
   (adds build cost; optional).

---

## Bundle / rendering

- No unused dependencies pulled into public routes by these changes.
- Route handlers (`feed.xml`, `news-sitemap.xml`) are Node server routes — they
  don't ship any client JS.
- The production build output confirms public content pages remain
  Static/SSG/ISR (see `technical-seo-report.md` build table); only truly dynamic
  pages (`/[category]`, `/articles/[slug]`, `/authors/[id]`, `/search`) are
  server-rendered on demand, which is correct for freshness.

**Recommend** running Lighthouse / PageSpeed Insights against a deployed URL with
the production backend to capture field numbers; the code-level prerequisites for
"Good" CWV are in place.
