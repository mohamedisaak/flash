# Indexing & Crawlability Report

Defines what should be indexed, what must not be, and how robots + sitemaps
enforce it — all now served from the **public site origin** (the Next.js app),
which is what crawlers actually fetch.

---

## robots.txt (`web/src/app/robots.ts` → `/robots.txt`)

```
User-agent: *
Allow: /
Disallow: /dashboard
Disallow: /dashboard/
Disallow: /search
Sitemap: {SITE_URL}/sitemap.xml
Sitemap: {SITE_URL}/news-sitemap.xml
Host: {SITE_URL}
```

- **Allows** all public content.
- **Blocks** the authenticated CMS (`/dashboard*`) and the thin internal search
  results (`/search`).
- Points at **both** sitemaps on the same origin.

> Note: the API host (`/api/*`, `/admin/*`) is a **different origin** and has its
> own backend-generated robots.txt already blocking those paths. From the public
> site's robots we only govern the public origin's paths.

---

## Index / noindex policy

### Indexed (public, valuable)
| Route | Notes |
|---|---|
| `/` | Home — WebSite/Org JSON-LD |
| `/[category]` | Section landing pages |
| `/articles/[slug]` | Core content; NewsArticle schema |
| `/authors/[id]` | Author profiles; ProfilePage schema |
| `/faq` | FAQPage schema |
| `/pages/[key]` | about / contact / terms / privacy / disclaimer |
| `/photo-gallery`, `/video-gallery` | Media landing pages |

### Noindex (explicit)
| Route | Mechanism |
|---|---|
| `/search` | `robots: { index:false, follow:true }` **and** `Disallow` in robots.txt |
| `/dashboard` + all children | `robots: { index:false, follow:false }` on `dashboard/layout.tsx` + `Disallow` |
| `/dashboard/login` | inherits dashboard noindex |
| `/not-found` (404) | `robots: { index:false, follow:true }` + 404 status |

### Redirect
| Route | Behaviour |
|---|---|
| `/about` | **308 permanent** → `/pages/about` |

---

## Sitemaps

### `/sitemap.xml` (`web/src/app/sitemap.ts`, revalidate 1h)
Enumerates **only real frontend routes**:
- `/` (priority 1.0), category pages (0.7), articles (0.8, or 0.9 if
  featured/breaking), author profiles (0.4), `/faq`, `/photo-gallery`,
  `/video-gallery`, and `/pages/{about,contact,terms,privacy,disclaimer}`.
- `lastModified` from each article's `published_at`; changeFrequency per type.
- Paginates the API (100/page, cap 5000). **Build-safe**: if the backend is down
  it degrades to the static routes.
- **Deliberately excludes** video/gallery *detail* URLs (no such frontend route
  → would be soft-404s), `/search`, and all dashboard routes.

### `/news-sitemap.xml` (`web/src/app/news-sitemap.xml/route.ts`, revalidate 5m)
Google-News-format sitemap with the `news:` namespace, last-48h articles only,
publication name from CMS settings, `language=en`. See `news-seo-report.md`.

### Coverage vs. exclusions summary
| Included | Excluded (by design) |
|---|---|
| Home, categories, articles, authors, FAQ, static pages, gallery landings | dashboard/*, /search, 404, video/gallery detail (nonexistent), API/admin (other origin) |

---

## Duplicate-URL / parameter handling

- **Search params** (`?q=`) live only under `/search`, which is noindexed +
  disallowed → no parameter-based duplicate index bloat.
- **Pagination**: category/author lists currently render a single page of recent
  items (no `?page=` indexable surface), so there are no thin paginated
  duplicates. If deep pagination is added later, add `rel=canonical` to page 1
  and keep deep pages out of the sitemap.
- **Canonical tags** on every indexable page prevent accidental duplicates;
  articles prefer the backend `canonical_url` for syndicated copy.

---

## Security / accidental indexing

- No private/authenticated data is server-rendered into public HTML.
- Dashboard is noindex+nofollow and Disallowed.
- **Staging protection (recommendation):** set an environment-based
  `X-Robots-Tag: noindex` (or a robots override) for non-production deployments
  so preview/staging origins are never indexed. Not added here (needs an env
  signal); flagged as R-ops.
- No API keys or secrets are exposed to the client beyond the intended
  `NEXT_PUBLIC_*` origins.

---

## Post-deploy checklist

1. Verify `https://<site>/robots.txt`, `/sitemap.xml`, `/news-sitemap.xml`,
   `/feed.xml`, `/manifest.webmanifest` all return 200 with correct content-types.
2. Submit `sitemap.xml` and `news-sitemap.xml` in Google Search Console + Bing
   Webmaster Tools.
3. Confirm `/search` and `/dashboard` show as "Excluded by robots"/"noindex".
4. Request indexing for the home and a few key articles to seed discovery.
