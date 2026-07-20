# RSS Feeds

**Topic:** SEO / Syndication · **Level:** Beginner → Intermediate

## 1. The idea in one sentence

> An RSS feed is a standard XML stream of your latest content that apps,
> aggregators, newsletters, and other services can subscribe to.

## 2. Why still bother with RSS?

It's quietly everywhere: news aggregators, "follow" features, email digest tools,
IFTTT-style automations, and podcast-like clients all consume RSS. It's a
zero-effort distribution channel and a signal of freshness.

## 3. Django's syndication framework

A `Feed` class describes the stream; Django renders valid RSS XML.
[`apps/seo/feeds.py`](../../backend/apps/seo/feeds.py):

```python
class LatestArticlesFeed(Feed):
    title = "Flash News — Latest"
    def items(self):            return Article.published[:20]
    def item_title(self, item): return item.title
    def item_description(self, item): return item.excerpt or item.meta_description
    def item_link(self, item):  return f"{SITE_URL}/articles/{item.slug}"
    def item_pubdate(self, item): return item.published_at
```

Wired in `config/urls.py`:
- `/rss/` — the latest across the whole site.
- `/rss/<slug>/` — a per-category feed (`CategoryFeed.get_object` looks up the
  category by slug, then `items(obj)` filters to it).

## 4. Reuse via subclassing

`CategoryFeed` extends `LatestArticlesFeed` and only overrides what differs
(`get_object`, `title`, `items`). Same DRY instinct as the rest of the codebase.

## 5. Only publish live content

`items()` uses `Article.published`, so drafts and future-scheduled posts never
leak into the feed — the same rule as the API and sitemaps.

## 6. Exercises

- **Beginner:** Open `/rss/` locally; find the `<item>` for your latest article.
- **Intermediate:** Add an author-specific feed at `/rss/author/<id>/`.
- **Advanced:** Switch the feed to Atom (`feed_type = Atom1Feed`) and note what
  changes in the XML.

## 7. Interview questions

- **Junior:** What is an RSS feed?
- **Mid:** How does the per-category feed reuse the latest feed?
- **Senior:** RSS vs a push API (WebSub/webhooks) for content distribution —
  trade-offs?

← [SEO topic index](README.md)
