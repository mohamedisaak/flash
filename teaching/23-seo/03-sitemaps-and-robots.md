# Sitemaps & robots.txt

**Topic:** SEO · **Level:** Intermediate

## 1. Two files that guide crawlers

- **`sitemap.xml`** — a list of your URLs (+ last-modified dates) so search
  engines discover and re-crawl efficiently instead of guessing.
- **`robots.txt`** — rules for what crawlers may fetch, plus pointers to your
  sitemaps.

## 2. The standard sitemap

Django's `contrib.sitemaps` framework generates the XML; we just describe which
objects to include. [`apps/seo/sitemaps.py`](../../backend/apps/seo/sitemaps.py):

```python
class ArticleSitemap(_FrontendSitemap):
    changefreq = "hourly"
    priority = 0.8
    def items(self):   return Article.published.all()
    def lastmod(self, obj): return obj.updated_at
    def location(self, obj): return f"/articles/{obj.slug}"
```

We register article/category/video/gallery sitemaps and wire the view in
`config/urls.py` at `/sitemap.xml`.

### The SITE_URL trick

By default the framework builds URLs from the *request's* host. But our pages
live on the Next.js frontend, possibly a different domain. So `_FrontendSitemap`
overrides `get_urls` to force the domain to `SITE_URL`'s host — a test asserts
the output contains `https://news.example.com/articles/...`, not the API host.

## 3. The Google News sitemap

Google News wants a **special** sitemap: a `<news:news>` block per URL with the
publication name, language, publish date, and title — and only articles from the
**last 48 hours**. That doesn't fit the generic framework, so we render it from a
template ([`apps/seo/views.py`](../../backend/apps/seo/views.py) +
`templates/seo/news_sitemap.xml`) at `/news-sitemap.xml`.

## 4. robots.txt

[`robots_txt`](../../backend/apps/seo/views.py) returns:

```
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Sitemap: https://news.example.com/sitemap.xml
Sitemap: https://news.example.com/news-sitemap.xml
```

We disallow `/admin/` and `/api/` (no SEO value, and we don't want them crawled)
and advertise both sitemaps.

## 5. Common mistakes

- Sitemap URLs pointing at the API host instead of the public site.
- Listing drafts/unpublished URLs (we use the `published` manager everywhere).
- Forgetting the 48-hour window on the News sitemap (it should stay small and
  fresh).
- Blocking a path in robots.txt *and* expecting `noindex` to work — a blocked
  page can't be crawled to *see* the noindex. Different tools, different jobs.

## 6. Exercises

- **Beginner:** Open `/sitemap.xml` and `/robots.txt` locally and read them.
- **Intermediate:** Add a sitemap for live blogs.
- **Advanced:** The article sitemap has `limit = 1000`. Explain how the framework
  paginates beyond that and why huge sitemaps get split.

## 7. Interview questions

- **Junior:** What is a sitemap for?
- **Mid:** How does a Google News sitemap differ from a standard one?
- **Senior:** robots.txt `Disallow` vs a `noindex` tag — when does each apply?

← [SEO topic index](README.md)
