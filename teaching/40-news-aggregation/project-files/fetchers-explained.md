# `apps/aggregation/fetchers.py` — explained

This module's job: turn *any* source into a list of `FeedItem`s, so the rest of
the pipeline is source-agnostic.

## The normalised shape

```python
@dataclass
class FeedItem:
    external_id: str   # feed guid, or the URL
    url: str
    title: str
    summary: str = ""
    author: str = ""
    image_url: str = ""
    published_at: datetime | None = None
```

RSS and every API map onto this. `services.py` only ever sees `FeedItem`s.

## RSS: `feedparser` + a manual fetch

We fetch the bytes ourselves with `urllib` (a browser-ish `User-Agent` and a
timeout — some publishers reject the default agent) and hand them to
`feedparser`, which is extremely tolerant of malformed feeds:

```python
raw = _http_get(source.url)          # our fetch: UA + 12s timeout
parsed = feedparser.parse(raw)       # tolerant parse
```

Two fiddly bits RSS makes you handle:

- **Images** live in different places per feed dialect — `media:content`,
  `media:thumbnail`, an `<enclosure>` link, or an `<img>` inside the summary
  HTML. `_rss_image` tries each in turn.
- **Dates** come as a `published_parsed` struct_time in UTC; we convert to an
  aware `datetime` with `calendar.timegm`.

## Sitemaps: for sites that dropped RSS

`fetch_sitemap` parses a Google-News sitemap (`<url>` blocks with `<loc>`,
`<news:title>`, `<news:publication_date>`, `<image:loc>`) into `FeedItem`s. The
big win over Google-News RSS: the `<loc>` is the **direct** article URL, so full
extraction works with no decoding. *Citizen* uses this. We parse with small
regexes rather than an XML library — sitemap namespaces (`news:`, `image:`) make
`ElementTree` fiddly, and the shape is simple and stable.

## Google-News link decoding: `google_news.py`

When a source is discovered via Google News RSS (*The Star*), each item link is
an opaque `news.google.com/rss/articles/CBMi…` redirect. `extract.py` calls
`google_news.decode_url` first: it scrapes a signature + timestamp from the
article page and POSTs them to Google's `batchexecute` endpoint, which returns
the real publisher URL. Best-effort — on any failure it returns `""` and the
import falls back to the summary. (This reuses `_http_get`'s new `data=` POST
support.)

## APIs: stdlib `urllib`, one function each

`_fetch_newsapi`, `_fetch_gnews`, `_fetch_newsdata` each call their endpoint and
map the provider's JSON onto `FeedItem`. No extra HTTP library — `urllib` is
enough. A provider with no key raises before any network call.

## Failure is a value, not a crash

Any network/parse problem raises `FetchError`. The caller
([`services.run_ingestion`](services-explained.md)) catches it **per source**,
records the message in that run's `detail`, and moves on. One dead feed never
sinks the run — you'll see `the-star: HTTP 404` in the report and everything
else still ingests.

## Sibling: `extract.py` — full article bodies

`fetchers.py` gets you the *feed* (summaries). `extract.py` gets you the *full
article*: given an item's `url`, it fetches the page (reusing `_http_get`) and
runs `trafilatura` to isolate the body from the site chrome, returning clean,
HTML-escaped `<p>` paragraphs (or `""` for gated/empty pages). It's called
on demand from `services.fetch_full_content` / `import_to_article`, never during
a broad ingestion run — one HTTP request per article is too slow to do in bulk
synchronously. See [the concept lesson §2b](../01-what-is-aggregation.md).

## Why fetch bytes ourselves instead of `feedparser.parse(url)`?

`feedparser` *can* fetch a URL directly, but then we don't control the timeout or
`User-Agent`, and image downloads (in `services`) reuse the same `_http_get`
helper — one place for HTTP behaviour.

## Common mistakes

- **No timeout.** A hung feed would freeze the whole synchronous run. `_TIMEOUT`
  guards every request.
- **Trusting feed HTML.** Titles/summaries are run through `strip_html` before
  storage so stray markup can't leak into the admin table.
- **Assuming a published date.** Many feeds omit it; `published_at` is nullable.

← [Topic index](../README.md)
