# News SEO Report (Google News / Top Stories)

The platform is a news publisher, so Google News technical compliance is
first-class. This report covers the NewsArticle schema, the news sitemap,
publisher identity, and content-freshness signals.

---

## Google News technical requirements — status

| Requirement | Status | Where |
|---|---|---|
| Unique, permanent article URLs | ✅ | `/articles/{slug}` (stable slug, `PROTECT` on author/category prevents orphaning) |
| `NewsArticle` structured data | ✅ | backend `build_news_article`, embedded on the article page |
| Headline (≤110 chars) | ✅ | `headline = title[:110]` |
| `datePublished` **and** `dateModified` | ✅ | from `published_at` / `updated_at` |
| Author (Person) | ✅ | article author name; OG `authors` links to `/authors/{id}` |
| Publisher (Organization + logo) | ✅ | `NewsMediaOrganization` + logo from CMS settings |
| Article image | ✅ | featured image (absolute URL) in schema + OG + Twitter |
| Article section/category | ✅ | `articleSection` + OG `section` |
| **Google News sitemap** (`news:` namespace, last 48h) | ✅ **added** | `/news-sitemap.xml` on the public origin |
| Publication name + language in news sitemap | ✅ | `site_name` + `language=en` |
| Fresh content signalling | ✅ | news sitemap revalidates every 5 min; RSS every 10 min |
| robots allows News crawler | ✅ | `Allow: /`; article paths not disallowed |

---

## Google News sitemap (`/news-sitemap.xml`) — added

- **Format:** `<urlset xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">`
  with `<news:publication>` (name + language), `<news:publication_date>`,
  `<news:title>` per URL.
- **Window:** only articles with `published_at` within the last **48 hours**
  (Google News ignores older entries; keeping the file small speeds crawling).
- **Origin:** served from the **public site domain** (the canonical article URLs
  match), refreshed every 5 minutes for freshness.
- **Referenced** from `/robots.txt` as a second `Sitemap:` line.

> The Django backend also has a Google News sitemap (`apps/seo/views.py`), but on
> the API origin. The new frontend one is what the News crawler will use for the
> canonical site. Both can coexist.

---

## Article-page news signals (verified)

- Visible **byline** (author link), **category** link, and **publish date** in
  the meta row — Google News wants a clear author + date on the page, matching
  the structured data.
- `<h1>` is the headline; body is semantic HTML.
- OG `type=article` with `publishedTime` + **`modifiedTime`** (added) so social
  and news surfaces show correct timestamps.
- Canonical honours `canonical_url` for syndicated/aggregated stories — critical
  for the aggregation pipeline so wire copy doesn't compete with the origin for
  Top Stories.

---

## Freshness & permanence

| Signal | Mechanism |
|---|---|
| Fast discovery of new articles | News sitemap (5 min) + RSS (10 min) + article ISR `revalidate=300` |
| Accurate "updated" time | `dateModified` / OG `modifiedTime` from `updated_at` |
| Stable URLs | slug-based, never recycled; `/about`-style legacy paths use 308 |
| Scheduled publishing | backend `publish_scheduled_articles` flips status at go-live; sitemap/feed pick it up on next revalidate |

---

## Gaps & recommendations

| # | Item | Priority | Notes |
|---|---|---|---|
| N1 | Add `image` **dimensions** (≥1200px wide `ImageObject` with width/height) to NewsArticle | High | Google News/Top Stories strongly prefer large images; backend emits URL only today |
| N2 | Consider `dateline`/`printSection` or `NewsArticle` subtype (`ReportageNewsArticle`) | Low | Marginal |
| N3 | Author `Person` `sameAs` (social links) + author bio on page | Medium | Improves author authority (E-E-A-T); `social_links` exist on the model |
| N4 | Ensure production images are ≥1200px and served via CDN | High | Infra/content |
| N5 | Verify site in **Google Publisher Center** and submit the news sitemap | High | Ops step for News inclusion |

---

## Summary

The News-specific technical foundation is now complete on the public origin:
NewsArticle schema with modified dates and publisher logo, a compliant
`news:`-namespace sitemap of the last 48h refreshed every 5 minutes, RSS, stable
canonical URLs, and correct byline/date rendering. The highest-value remaining
work is **image dimensions in the NewsArticle schema (N1/N4)** and **Publisher
Center verification (N5)** — the former a small backend enhancement, the latter
an operations task.
