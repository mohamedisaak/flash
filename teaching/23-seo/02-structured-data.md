# Structured Data (Schema.org / JSON-LD)

**Topic:** SEO · **Level:** Intermediate

## 1. The idea in one sentence

> Structured data is a small JSON block on a page that spells out its meaning —
> "this is a **NewsArticle**, headline X, author Y, published Z" — in a
> vocabulary (schema.org) that search engines read directly.

## 2. Why it matters

Google can *guess* a page's headline and date from HTML, but structured data
tells it **explicitly**, unlocking rich results: the big headline + thumbnail in
Top Stories, the author and date, video previews. For news, `NewsArticle`
markup is effectively required for Top Stories eligibility.

## 3. JSON-LD: the preferred format

Structured data can be embedded three ways; Google prefers **JSON-LD** — a
`<script type="application/ld+json">` block, separate from the visible HTML:

```json
{
  "@context": "https://schema.org",
  "@type": "NewsArticle",
  "headline": "Kenya election results",
  "datePublished": "2027-08-09T18:00:00+00:00",
  "author": {"@type": "Person", "name": "A. Journalist"},
  "publisher": {"@type": "Organization", "name": "Flash News"}
}
```

## 4. In this project

[`apps/seo/structured_data.py`](../../backend/apps/seo/structured_data.py) has
pure builder functions:

- `build_news_article(article)` → NewsArticle
- `build_organization()` → the reusable publisher block
- `build_breadcrumb([(name, path), ...])` → BreadcrumbList
- `build_video_object(video)` → VideoObject

The API serves them via [`apps/seo/api.py`](../../backend/apps/seo/api.py):

```
GET /api/v1/seo/articles/<slug>/   → { newsArticle, breadcrumb }
GET /api/v1/seo/organization/      → Organization
GET /api/v1/seo/videos/<slug>/     → VideoObject
```

The Next.js frontend fetches these and drops them into the page's `<head>`, so
the schema shapes live in one place (the backend) instead of being re-derived in
the frontend.

## 5. A design choice: one-way dependency

The `seo` app imports from `articles`/`videos`, but **those apps never import
`seo`.** SEO is a downstream concern that reads the domain; the domain stays
unaware of it. This keeps the content apps clean and avoids circular imports —
a good instinct for a modular monolith.

## 6. Details that matter

- `headline` is truncated to ~110 chars (Google's display limit).
- Dates are ISO-8601 with timezone (`.isoformat()`).
- Image/thumbnail URLs are made **absolute** against `SITE_URL`.
- The publisher block is built once and reused inside every article.

## 7. Exercises

- **Beginner:** Fetch `/api/v1/seo/organization/` and read the JSON.
- **Intermediate:** Add `wordCount` and `keywords` to the NewsArticle builder,
  then update the test.
- **Advanced:** Add an `ImageObject` builder and validate the article output
  against Google's Rich Results Test.

## 8. Interview questions

- **Junior:** What is structured data and why add it?
- **Mid:** Why JSON-LD over microdata? What's the `NewsArticle` type for?
- **Senior:** How would you keep structured data in sync between the API and a
  separately-deployed frontend?

← [SEO topic index](README.md)
