# Metadata Report

Per-page metadata coverage **after** optimization. Every public, indexable page
now has a unique title, description, canonical, Open Graph, and (where relevant)
Twitter card. Titles use the root template `%s — {SiteName}` except the home
page, which uses the bare site name (`title.absolute`).

Legend: ✅ present · ➕ added in this audit · — not applicable.

---

## Coverage matrix (public pages)

| Route | Title | Description | Canonical | Open Graph | Twitter | Robots | JSON-LD |
|---|---|---|---|---|---|---|---|
| `/` (home) | ➕ unique | ➕ | ➕ `/` | ➕ website | ✅ (root) | index | ➕ WebSite+Org |
| `/[category]` | ✅ | ✅ | ✅ | ➕ website | ➕ | index | ➕ Breadcrumb+Collection |
| `/articles/[slug]` | ✅ | ✅ | ✅ (+`canonical_url`) | ✅➕ article | ✅ | index | ✅ NewsArticle+Breadcrumb |
| `/authors/[id]` | ✅ | ➕ | ➕ | ➕ profile | ➕ | index | ➕ ProfilePage+Breadcrumb |
| `/faq` | ✅ | ➕ | ➕ | — | — | index | ➕ FAQPage |
| `/pages/[key]` | ✅ | ➕ (auto-summary) | ➕ | ➕ article | — | index | — |
| `/photo-gallery` | ✅ | ➕ | ➕ | ➕ website | — | index | — |
| `/video-gallery` | ✅ | ➕ | ➕ | ➕ website | — | index | — |
| `/about` | — | — | — | — | — | **308 → /pages/about** | — |
| `/search` | ✅ | — | — | — | — | **noindex, follow** | — |
| `/not-found` (404) | ➕ | — | — | — | — | **noindex, follow** | — |

## Coverage matrix (private — intentionally excluded)

| Route | Robots |
|---|---|
| `/dashboard` and all children | **noindex, nofollow** (set on `dashboard/layout.tsx`) |
| `/dashboard/login` | inherits **noindex, nofollow** |

---

## Document-head defaults (root `layout.tsx`) ➕

- `metadataBase` = `NEXT_PUBLIC_SITE_URL` (so relative canonicals/OG resolve to
  absolute URLs).
- Title template `%s — {SiteName}`, dynamic from CMS `site_name`.
- Default description from CMS `about_us`.
- `viewport`: `width=device-width, initial-scale=1`, **theme-color** (light/dark).
- Default **robots**: `index, follow` + googleBot `max-image-preview:large`,
  `max-snippet:-1`, `max-video-preview:-1`.
- Default **Twitter**: `summary_large_image`.
- `applicationName`, `formatDetection` (telephone/email/address off).
- **RSS alternate**: `/feed.xml` advertised in `<head>`.
- Icons auto-detected from `src/app/icon.svg` (Next file convention).

---

## Issues found & resolved

| Issue | Before | After |
|---|---|---|
| Home page had no unique description/canonical/OG | inherited root default only | ➕ dedicated `generateMetadata` |
| Author page had title only | `"{name} — Author"` | ➕ description, canonical, OG(profile), Twitter |
| FAQ / galleries / static pages: title only | no description/canonical | ➕ description + canonical + OG |
| Article missing `modifiedTime`/`section`/tags | publishedTime only | ➕ modified/section/tags/keywords/author URL |
| Category missing OG/Twitter | title+desc+canonical | ➕ OG + Twitter |
| No theme-color / viewport meta control | Next defaults | ➕ explicit `viewport` export |
| No Twitter defaults | none | ➕ root default card |
| No RSS discovery link | none | ➕ `alternates.types` |
| Dangerous global canonical `/` (draft) | would break all pages | removed; per-page canonicals |

**No duplicate titles or descriptions** exist across static routes; dynamic
routes derive unique values per record (article/category/author/page).

---

## Missing metadata still outstanding

- **Per-article social image variant** (`opengraph-image`): pages currently use
  the article's featured image as the OG image (good). A dynamically rendered
  branded OG card (`ImageResponse`) is a future enhancement, not a gap.
- No missing titles/descriptions/OG/Twitter remain on public pages.
