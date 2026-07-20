# SEO Foundations

**Topic:** SEO · **Level:** Beginner

## 1. The idea in one sentence

> SEO (Search Engine Optimization) is making your content easy for search engines
> to **find**, **understand**, and **trust**, so it ranks well and drives readers.

## 2. Why a news site lives or dies by SEO

Most readers arrive from Google Search, Google News, and Discover — not by typing
your URL. If Google can't crawl a story within minutes of publishing, you lose
the traffic window. So SEO isn't decoration; for news it's the distribution
channel.

## 3. The three jobs

| Job | Question it answers | Tools we use |
|-----|---------------------|--------------|
| **Find** | "What pages exist and what's new?" | sitemaps, Google News sitemap, RSS, robots.txt |
| **Understand** | "What is this page *about*?" | metadata (title/description/OG) + JSON-LD structured data |
| **Trust / rank** | "Is it fast and good?" | performance (Core Web Vitals), quality |

Phase 4 (backend) delivers the "find" and "understand" machinery; the "trust"
side (fast pages) is mostly the Next.js frontend's job in Phase 5.

## 4. Where SEO lives in this project

- **Find:** [`apps/seo/sitemaps.py`](../../backend/apps/seo/sitemaps.py),
  [`apps/seo/views.py`](../../backend/apps/seo/views.py) (news sitemap +
  robots.txt), [`apps/seo/feeds.py`](../../backend/apps/seo/feeds.py) (RSS).
- **Understand:** per-object metadata (the `SEOFields` mixin from Phase 1) +
  [`apps/seo/structured_data.py`](../../backend/apps/seo/structured_data.py)
  (JSON-LD).
- **Trust:** the frontend renders fast SSR/SSG/ISR pages (Phase 5).

## 5. Absolute URLs everywhere

Search engines need **absolute** URLs (`https://news.example.com/articles/x`),
not relative ones. Since the public pages live on the Next.js frontend (a
possibly different domain than this API), all our SEO output is built from the
`SITE_URL` setting. Get this wrong and Google indexes the wrong host.

## 6. Interview questions

- **Junior:** Why does a news site depend so heavily on SEO?
- **Mid:** Name the three "jobs" of SEO and one tool for each.
- **Senior:** Why must SEO artifacts use absolute URLs from a canonical host?

← [SEO topic index](README.md)
