# Technical SEO Report

**Scope:** Full technical SEO audit and optimization of the public-facing
**Next.js 16 (App Router)** website in `web/`, plus review of the Django/DRF
backend's SEO surfaces (`backend/apps/seo`). The application was **not**
redesigned; all existing functionality is unchanged. Backend behaviour was not
modified — the backend already ships a strong SEO layer (sitemaps, news sitemap,
robots, JSON-LD API, RSS). The gap was that **none of it was served from the
public site's own origin**, and several frontend pages lacked complete metadata
and structured data.

**Validation performed**
- `pnpm typecheck` — clean.
- `pnpm lint` — 0 errors (3 pre-existing warnings in untouched dashboard files).
- `pnpm build` — succeeds; all new routes render (`/robots.txt`, `/sitemap.xml`,
  `/news-sitemap.xml`, `/feed.xml`, `/manifest.webmanifest`).

Severity: **P0** critical · **P1** high · **P2** medium · **P3** low.

---

## Architecture finding (the big one)

### P0-1 — No robots.txt or sitemap on the public site origin ✅ FIXED
- **Problem:** The Django backend generates excellent `robots.txt`,
  `sitemap.xml`, `news-sitemap.xml`, and RSS — but they live on the **API
  origin** (e.g. `api.example.com`). The canonical public site is the Next.js
  app on a **different origin** (`NEXT_PUBLIC_SITE_URL`). Crawlers fetch
  `https://<public-site>/robots.txt` and `…/sitemap.xml` — which **did not
  exist** on the Next origin. The site was effectively shipping without a
  discoverable robots policy or sitemap.
- **Fix:** Added native Next.js route files that serve these from the public
  origin, reusing the REST API for data:
  - `web/src/app/robots.ts` → `/robots.txt`
  - `web/src/app/sitemap.ts` → `/sitemap.xml`
  - `web/src/app/news-sitemap.xml/route.ts` → Google News sitemap
  - `web/src/app/feed.xml/route.ts` → RSS 2.0
  - `web/src/app/manifest.ts` → `/manifest.webmanifest`
- The backend equivalents were left intact (useful if the API host is ever
  fronted at the same origin, and harmless otherwise).

### P1-2 — Backend sitemap lists frontend routes that don't exist ⚠ DOCUMENTED
- `backend/apps/seo/sitemaps.py` includes `VideoSitemap` → `/videos/<slug>` and
  `GallerySitemap` → `/galleries/<slug>`, but the **frontend has no such
  detail routes** (only `/video-gallery` and `/photo-gallery` list pages exist).
  If the backend sitemap is ever exposed on the public origin, those URLs would
  be soft-404s.
- **Action taken:** the new **frontend** `sitemap.ts` deliberately omits video/
  gallery detail URLs. **Recommendation:** either build `/videos/[slug]` &
  `/galleries/[slug]` detail pages, or drop those two sitemaps from the backend
  registry. Not changed (backend behaviour left untouched per scope).

---

## Metadata

### P1-3 — Incomplete document-head defaults ✅ FIXED
`web/src/app/layout.tsx` had only title/description/basic OG. Added, without
changing the visible UI:
- `viewport` export with **theme-color** (light/dark) + explicit
  `width=device-width, initial-scale=1`.
- Default **robots** directives (`index, follow`, `googleBot` with
  `max-image-preview:large`, `max-snippet:-1`, `max-video-preview:-1`).
- Default **Twitter card** (`summary_large_image`), OG `locale`/`url`,
  `applicationName`, `formatDetection`.
- **RSS discovery** via `alternates.types['application/rss+xml'] → /feed.xml`.
- **Removed a dangerous default:** an earlier draft set a site-wide
  `alternates.canonical: "/"`. That would canonicalize *every* page lacking its
  own canonical to the home page. It was removed; each indexable page now sets
  its own canonical instead.

### P1-4 — Pages missing per-page metadata ✅ FIXED
Added `generateMetadata`/`metadata` (unique title, description, canonical, OG,
Twitter where relevant) to: **home** (was inheriting root only), **author**
(had title only), **FAQ**, **static `/pages/[key]`**, **photo-gallery**,
**video-gallery**, **not-found**. Enriched **category** (added OG/Twitter) and
**article** (added `modifiedTime`, `section`, `tags`, OG `url`, `authors` with
profile URL, `keywords`).

Full per-page matrix in `metadata-report.md`.

---

## Canonical URLs & duplicate content

### P2-5 — Canonicalization ✅ ADDRESSED
- Every indexable page now emits an explicit, absolute `rel=canonical`.
- Articles honour the backend's `canonical_url` field first (for syndicated/
  aggregated stories that credit an original source), falling back to the
  self-URL — preventing duplicate-content dilution for wire copy.
- `/search` is `noindex, follow` (thin internal results) and `Disallow`ed in
  robots, so query-parameter permutations (`?q=`) never create duplicate
  indexable URLs.

### P2-6 — Trailing slash / casing consistency ✅ VERIFIED
Next App Router serves canonical no-trailing-slash lowercase paths; all internal
`<Link>`s and generated URLs use lowercase slugs from the API. No mixed-case or
trailing-slash duplicates found.

---

## Redirects & status codes

### P2-7 — `/about` used a temporary redirect ✅ FIXED
`web/src/app/(site)/about/page.tsx` used `redirect()` (**307 temporary**) for a
permanent legacy alias. Changed to `permanentRedirect()` (**308**) so link
equity transfers to `/pages/about`.

- 404s: `not-found.tsx` renders with the correct 404 status (Next convention)
  and is now `noindex`.
- No redirect chains or loops found.

---

## Structured data
See `structured-data-report.md`. Summary: added WebSite (+SearchAction),
Organization, BreadcrumbList, CollectionPage, ProfilePage/Person, and FAQPage
JSON-LD on the frontend; the backend already provides NewsArticle + Breadcrumb +
VideoObject, embedded on the article page.

## Performance / Core Web Vitals
See `performance-report.md`. Notable: fonts already use a **system stack** (no
render-blocking web fonts), images already use `next/image` with `priority` on
the LCP hero and `sizes` everywhere, and GA loads with `strategy="afterInteractive"`.

## Accessibility
See `accessibility-report.md`.

## Indexing strategy
See `indexing-report.md`.

## News SEO
See `news-seo-report.md`.

---

## Files changed / added

**Added (7):** `robots.ts`, `sitemap.ts`, `news-sitemap.xml/route.ts`,
`feed.xml/route.ts`, `manifest.ts`, `lib/seo.ts`, (this audit dir).

**Edited (11):** `layout.tsx`, `(site)/page.tsx`, `(site)/[category]/page.tsx`,
`(site)/articles/[slug]/page.tsx`, `(site)/authors/[id]/page.tsx`,
`(site)/faq/page.tsx`, `(site)/pages/[key]/page.tsx`,
`(site)/photo-gallery/page.tsx`, `(site)/video-gallery/page.tsx`,
`(site)/not-found.tsx`, `(site)/about/page.tsx`.

**Not changed:** all backend code (already sound), all dashboard UI, all visible
public UI (only `<head>`/JSON-LD output changed).

---

## Remaining recommendations (not applied — need product/infra decisions)

| # | Item | Why deferred |
|---|---|---|
| R1 | Build `/videos/[slug]` & `/galleries/[slug]` detail pages | New feature/route (out of "don't redesign" scope) |
| R2 | Per-article `opengraph-image` (dynamic OG via `ImageResponse`) | Nice-to-have; current OG uses the featured image |
| R3 | Ensure production `Cache-Control`/CDN + Brotli for HTML | Infra (nginx/CDN) config, not app code |
| R4 | Verify the public domain in Search Console / Bing Webmaster; submit sitemaps | Ops task |
| R5 | Drop the redundant backend video/gallery sitemaps or wire them to real routes | Backend change, left per scope |
