# Structured Data (JSON-LD) Report

All structured data is emitted as `<script type="application/ld+json">` via the
hardened `web/src/components/json-ld.tsx` component, which escapes `<`, `>`, `&`,
and U+2028/U+2029 to prevent script-breakout XSS (important because some values
originate from aggregated external feeds).

Two sources feed it:
- **Backend builders** (`backend/apps/seo/structured_data.py`, exposed via
  `/api/v1/seo/…`) — already existed for NewsArticle, Breadcrumb, VideoObject,
  Organization.
- **Frontend builders** (`web/src/lib/seo.ts`) — **added in this audit** for the
  site graph, breadcrumbs, collections, author profiles, and FAQ, so those pages
  are self-contained.

---

## Schema types implemented (after)

| Type | Page(s) | Source | Status |
|---|---|---|---|
| `WebSite` + `SearchAction` | Home | frontend | ➕ added |
| `NewsMediaOrganization` (+logo `ImageObject`) | Home | frontend | ➕ added |
| `NewsArticle` | Article | backend API | ✅ existing |
| `BreadcrumbList` | Article, Category, Author | backend (article) + frontend (category/author) | ✅ / ➕ |
| `CollectionPage` | Category | frontend | ➕ added |
| `ProfilePage` + `Person` | Author | frontend | ➕ added |
| `FAQPage` (`Question`/`Answer`) | FAQ | frontend | ➕ added |
| `VideoObject` | (video detail — endpoint ready) | backend API | ✅ existing (unused until detail route exists) |

### `NewsArticle` fields (backend `build_news_article`) — verified complete
`headline` (≤110 chars), `description`, `datePublished`, **`dateModified`**,
`author` (Person), `publisher` (Organization + logo), `mainEntityOfPage`,
`articleSection`, `image[]`. This satisfies Google's Article/NewsArticle
required + recommended properties.

### `WebSite` SearchAction
Declares `urlTemplate = {site}/search?q={search_term_string}` → enables the
Google **sitelinks search box** and tells Google the canonical on-site search
endpoint.

### `Organization`
Uses `NewsMediaOrganization` (a more specific type for a news publisher) with
`name`, `url`, and `logo` (absolute, from CMS settings). The logo powers the
publisher byline/knowledge panel for Top Stories eligibility.

---

## Missing / recommended structured data

| Type | Where it would go | Priority | Notes |
|---|---|---|---|
| `ImageObject` with explicit `width`/`height` | inside NewsArticle `image` | Medium | Google prefers ≥1200px wide images; backend currently emits the URL only. Enhance `build_news_article` to include dimensions. |
| `VideoObject` on a real video detail page | `/videos/[slug]` | Medium | Builder exists; needs the frontend route (R1). |
| `BreadcrumbList` on galleries/static pages | those pages | Low | Shallow hierarchy; low value. |
| `Person` `sameAs` (social links) | Author `Person` | Low | The user model stores `social_links`; not exposed in the public author card yet. |
| `speakable` | NewsArticle | Low | Optional voice-assistant hint. |

---

## Validation guidance

- **Rich Results Test** (search.google.com/test/rich-results) on an article URL:
  expect NewsArticle + BreadcrumbList valid.
- **Schema Markup Validator** (validator.schema.org) on home (WebSite +
  Organization), category (CollectionPage + Breadcrumb), author (ProfilePage),
  FAQ (FAQPage).
- All builders return plain objects serialized through the XSS-safe encoder;
  output is valid JSON-LD (verified structurally; the production build renders
  the tags without error).

**No structured-data errors introduced.** The one substantive enhancement left
open is adding image dimensions to the article `image` node.
