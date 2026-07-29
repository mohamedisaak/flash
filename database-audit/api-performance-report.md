# API Performance Report

Every REST endpoint was inspected for query efficiency, payload size, pagination,
and mobile-network friendliness. The Django REST API is the single backend for
both the Next.js web app and the Expo/React Native mobile app, so every byte and
query saved benefits both surfaces.

---

## Endpoints inspected

| Router prefix | ViewSet/View | Status |
|---|---|---|
| `/articles/` | `ArticleViewSet` (+`/view/` action) | ✅ optimal reads; write-amplification noted (R1) |
| `/articles/breaking/` | `BreakingNewsViewSet` | ✅ filtered `is_active` |
| `/categories/`, `/tags/` | `CategoryViewSet`, `TagViewSet` | ✅ **fixed** (annotate count) |
| `/comments/` | `CommentViewSet` (+`/report/`) | ✅ **fixed** (annotate reply_count) |
| `/videos/` | `VideoViewSet` | ✅ `select_related`+`prefetch` |
| `/galleries/`, `/gallery-images/` | `PhotoGalleryViewSet`… | ✅ reads; payload note (R4) |
| `/live-blogs/`, `/live-updates/` | live coverage | ✅ reads; per-blog updates note (R2) |
| `/ads/` (+`/impression/`,`/click/`) | `AdvertisementViewSet` | ✅ reads; write-amplification (R1) |
| `/newsletter/…` | subscribe/unsubscribe/list | ✅ `update()` on unsubscribe |
| `/notifications/` | `NotificationViewSet` | ✅ scoped + **index added** |
| `/cms/…`, `/stats/` | CMS + dashboard | ✅ reads; cache recs (C1/C2) |
| `/analytics/pageview/`, `/analytics/dashboard/` | ingest + dashboard | ✅ ingest lean; dashboard cache rec (C2) |
| `/search/`, `/search/autocomplete/` | search | ✅ **fixed** (single count) |
| `/aggregation/…` | aggregation admin | ✅ **fixed** (`select_related`) |
| `/auth/…`, `/users/` | accounts | ✅ standard |

All list endpoints inherit `DefaultPagination` (`PAGE_SIZE=20`,
`max_page_size=100`) — **no endpoint can dump a full table**.

---

## Payload optimizations

### Already good
- **Article list vs detail split:** `ArticleListSerializer` omits the heavy
  `content` body; only the detail endpoint returns it. This is the single most
  important payload decision for a news feed and it's correct.
- **Aggregation list** omits the extracted `content`; only `retrieve` includes it
  (`AggregatedArticleDetailSerializer`). `has_content` is exposed as a boolean.

### Recommended (contract changes → not applied)
- **R3 — trim nested category on article cards.** `ArticleListSerializer` embeds
  the full `CategorySerializer` (description, `featured_image`, SEO fields,
  `parent`, `order`, `article_count`) for every article, but web/mobile only read
  `category.name` and `.slug`. A `CategoryMiniSerializer` (`id`, `name`, `slug`)
  would shrink the busiest response (and mobile data usage) substantially. This
  changes the response shape, so it needs a deliberate contract bump.
- **R4 — gallery list images.** The gallery *list* returns every image of every
  gallery. Split into a light list serializer (cover image + counts) and a full
  detail serializer.

### Field selection / sparse fieldsets
Not currently supported. For mobile especially, a `?fields=` sparse-fieldset
mechanism (or the R3 mini serializers) would cut payloads. Recommended as a future
enhancement; not added to avoid inventing new API surface in an
optimization-only pass.

---

## Query efficiency (see query-optimization-report.md for numbers)

- Article list **23 → 3** queries; comment list **23 → 3**; category list
  **7 → 2**; aggregation list **1+N → 1**; search FTS executions **3 → 2**.
- Every remaining list endpoint issues the irreducible minimum (count + page +
  one prefetch per related collection).

---

## Mobile-specific optimizations

- **Same optimized endpoints** → the mobile feed (`listArticles` default
  `page_size:20`) now costs 3 queries instead of 23 per fetch.
- **TanStack Query** config is mobile-appropriate: `staleTime: 60_000`,
  `retry: 1` — avoids refetch-on-focus data burn and limits retries on flaky
  networks.
- **Compression:** ensure the production nginx/ASGI layer sends `gzip`/`br` for
  JSON responses (backend emits plain JSON; compression is an edge concern). This
  is the biggest single mobile-bandwidth lever and is an infra config, not code.
- **Recommendation:** adopt the R3 mini category serializer specifically to
  shrink the mobile feed payload; and consider ETag/`If-None-Match` on article
  detail so a re-opened story returns `304` instead of a full body.

---

## Pagination review

- All viewsets/list views: ✅ paginated (global default).
- `google_news_sitemap` caps at `[:1000]` and `select_related("category")` — ✅
  bounded, no N+1.
- No large `OFFSET` hotspots found; page sizes are capped at 100. For very deep
  pagination on large tables (e.g. an admin scrolling all articles), **cursor
  pagination** would avoid large-offset scans — recommended only if that access
  pattern appears in practice.

---

## Summary

The API was already structured sensibly (pagination everywhere, list/detail
splits on the two heaviest resources, sane frontend/mobile caching). The defects
were **query-shape N+1s hidden behind serializer fields**, now fixed with no
contract change. The remaining opportunities (payload trimming, sparse fieldsets,
ETags, compression) are contract/infra changes documented for a deliberate future
pass.
