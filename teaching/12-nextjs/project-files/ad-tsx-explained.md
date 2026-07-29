# `components/public/ad.tsx` — the ad-slot component, explained

## Why it exists

The admin can create ads (Phase 5c), and the backend serves them at
`/ads/?placement=…` (Phase 1/2). But until now the public site only rendered
**grey placeholder boxes** — the display half was never wired up, so an uploaded
ad image never appeared. `Ad` is the missing link: one reusable component that
turns a *placement slot* into a real, data-driven ad, with a graceful fallback
to the old placeholder when no ad is configured.

## What problem it solves

Every page that shows ads (home banner, sidebar on home/category/article) needs
the same logic: fetch the active ad for a slot, decide between an image ad and
an HTML ad, link it, and degrade nicely when there's nothing to show. Copy-
pasting that into each page would drift. `Ad` centralizes it behind a tiny API:

```tsx
<Ad placement="sidebar" className="h-72 text-lg" />
<Ad placement="header"  className="my-6 h-28 text-xl" />
```

## How it works

1. **It's an async server component.** It calls `api.listAds(placement)` at
   render/ISR time — no client-side fetch, no loading spinner, no layout shift.
   The ad is baked into the prerendered HTML and refreshes on the ISR window
   (`revalidate: 120`).
2. **Render branches, in priority order:**
   - **Image ad** → wrapped in an `<a target="_blank" rel="noopener sponsored">`
     when `target_url` is set. The image ad itself has *two* layouts:
     - **Banner** (a `height` prop is passed, e.g. header/in-content): if
       `left_text`/`right_text` are set, the image is centered at its natural
       width and the side text fills the gaps; otherwise the image fills the
       banner box and an optional `overlay_text` caption is drawn on top.
     - **Default** (no `height`, e.g. sidebar): the whole image, with an
       optional overlay caption.
   - **HTML ad** (no image) → raw markup via `dangerouslySetInnerHTML`, for
     ad-network `<script>`/`<ins>` snippets.
   - **Nothing configured** → the neutral grey `Placeholder`, so the layout is
     identical whether or not an ad exists.
3. **Side text and overlay are mutually exclusive.** `hasSideText` (either side
   field non-empty) decides: side text wins, overlay is the fallback. The
   `OverlayCaption` helper is shared by the banner and default layouts, so the
   caption renders in *both* — an earlier version only rendered it in the default
   layout, so an overlay set on a banner ad silently never appeared.
4. **`image_fit` picks `object-contain` vs `object-cover`.** Contain shows the
   whole creative (may letterbox); cover fills the slot and crops. Use cover for
   a centered subject where edge-cropping is fine, contain when the entire image
   must be visible.
5. **`className` carries the slot's size/spacing** (`h-72`, `my-6 h-28`) so one
   component serves both a tall sidebar rail and a short banner.

## How it interacts with other files

- `lib/api.ts` → `listAds()` — the build-safe fetch (returns `[]` if the backend
  is down, so the placeholder shows instead of a crash).
- `lib/types.ts` → `Advertisement` / `AdPlacement` — the response shape; the
  `AdPlacement` union matches the backend `AdPlacement.choices` **and** the
  admin's `AD_PLACEMENTS`, so the three stay in sync.
- `next.config` `images.remotePatterns` — must whitelist the backend media host,
  or `next/image` refuses to optimize the ad image (same rule as article images).
- `sidebar.tsx` / `app/(site)/page.tsx` — the consumers that replaced their
  hardcoded grey boxes with `<Ad/>`.

## Common mistakes

- **`dangerouslySetInnerHTML` is a trust decision.** It's acceptable here only
  because ad HTML is authored by trusted editorial staff behind auth. Never feed
  it user-generated content — that's stored XSS.
- **Forgetting `remotePatterns`** → the image 500s in production even though the
  URL is correct. The grey box would be safer-looking but the real fix is config.
- **Filtering only by `placement`** and forgetting `is_active=true` → paused ads
  leak onto the site. The query sends both.
- **Expecting instant updates.** With ISR the slot can lag up to the revalidate
  window; that's the caching trade-off, not a bug.
- **A field that renders in only one layout looks "broken."** `overlay_text`
  first rendered only in the default (sidebar) layout, so setting it on a
  header/in-content banner did nothing. The fix was to share `OverlayCaption`
  across both layouts. Lesson: when a model field is meant to be universal,
  check every render path uses it — not just the one you tested.
- **A wrong `sizes` makes `next/image` blurry.** `sizes` tells the optimizer how
  wide the image will *render* so it can pick a source width. We first hardcoded
  `sizes="…320px"`; in a full-width banner the browser then upscaled a 320px
  source → blur. Pass the slot's real width (banner ≈ full content width, sidebar
  ≈ 320px) so a crisp rendition is served. Also: `next/image` can't add detail to
  a small original — creatives are optimised on upload
  ([`apps/common/images.py`](../../30-database-design/) via the ad model's `save()`:
  EXIF-orient, cap to 1600px, re-encode), but a tiny source still needs a bigger
  re-upload.

## Best practices shown here

- A single reusable slot component over per-page copies.
- Graceful degradation (placeholder) so a missing/expired ad never breaks layout.
- `rel="sponsored"` on paid links — correct SEO signaling for ads.
- Server-side rendering of ads = no client JS cost and no cumulative layout
  shift.

## Where to go next

- The backend also exposes `POST /ads/{id}/impression/` and `/click/` for
  tracking. A good follow-up exercise: increment impressions when an ad renders
  and record clicks on the outbound link (a small client wrapper around `<a>`).
- Related: [ads-tables.md](../../30-database-design/ads-tables.md) for the data
  model, and [07-dashboard-and-forms.md](../07-dashboard-and-forms.md) §7b for
  the multipart upload bug that had to be fixed before an ad image could be saved
  at all.
