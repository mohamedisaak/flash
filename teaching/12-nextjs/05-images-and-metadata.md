# Metadata, JSON-LD & Images

**Topic:** Next.js · **Level:** Intermediate

## 1. Per-page SEO metadata

Every page can export `metadata` (static) or `generateMetadata` (dynamic) to set
its `<title>`, description, and social tags. The article page derives them from
the article's own SEO fields
([`web/src/app/articles/[slug]/page.tsx`](../../web/src/app/articles/[slug]/page.tsx)):

```tsx
export async function generateMetadata({ params }): Promise<Metadata> {
  const { slug } = await params;                 // params is a Promise in Next 16
  const article = await api.getArticle(slug);
  return {
    title: article.seo_title || article.title,
    description: article.meta_description || article.excerpt,
    alternates: { canonical: article.canonical_url || `${siteUrl}/articles/${slug}` },
    openGraph: { type: "article", images: [image], ... },
    twitter: { card: "summary_large_image", ... },
  };
}
```

The root [`layout.tsx`](../../web/src/app/layout.tsx) sets site-wide defaults and
a `title.template` (`"%s — Flash News"`), plus `metadataBase` so relative OG URLs
resolve to absolute ones.

## 2. Canonical URLs

`alternates.canonical` tells Google the one true URL for a page, preventing
duplicate-content penalties (e.g. when the same story is reachable via multiple
paths). We point it at the article's canonical field or the site URL.

## 3. JSON-LD (structured data)

Metadata tags describe the page; **JSON-LD** describes the *content* in
schema.org terms and unlocks rich results. We fetch it from the backend's SEO
endpoint and embed it with [`<JsonLd>`](../../web/src/components/json-ld.tsx):

```tsx
const jsonLd = await api.getArticleJsonLd(slug);
<JsonLd data={jsonLd?.newsArticle} />
<JsonLd data={jsonLd?.breadcrumb} />
```

Building the schema on the backend (Phase 4) means the frontend just injects it —
one source of truth. See [`../23-seo/02-structured-data.md`](../23-seo/02-structured-data.md).

## 4. `next/image`

`<Image>` optimizes images automatically: correct sizes per device, lazy-loading,
and modern formats. Two rules:

- The host must be whitelisted in
  [`next.config.ts`](../../web/next.config.ts) `images.remotePatterns` (we allow
  the Django media host).
- Use `priority` on the above-the-fold hero image so it loads eagerly (helps LCP,
  a Core Web Vital).

### Gotcha: the private-IP SSRF guard (Next 16)

Whitelisting the host is necessary but **not sufficient** in dev. Next 16's image
optimizer refuses to fetch an upstream image whose host resolves to a *private
IP* — `localhost`, `127.0.0.1`, `::1` — because a server-side fetch to an
attacker-chosen private address is a classic **SSRF** (Server-Side Request
Forgery) vector. Our Django media server in dev lives at `localhost:8000`, so the
optimizer returns a `400` and the browser shows a broken-image icon, with this in
the dev log:

```
⨯ upstream image http://localhost:8000/media/… resolved to private ip ["::1","127.0.0.1"]
```

The whitelist matched — the guard fired *after*. The fix is an explicit,
**dev-only** opt-in:

```ts
const isDev = process.env.NODE_ENV === "development";
const nextConfig = {
  images: {
    dangerouslyAllowLocalIP: isDev, // never in production
    remotePatterns: [/* … */],
  },
};
```

Two things make this safe: it's gated to development, and in production the media
host is a real public domain/CDN, so the guard never trips there anyway. The
`dangerously` prefix is Next's convention for "you're switching off a safety —
be sure." A change to `next.config.ts` is **not** hot-reloaded; restart the dev
server for it to take effect.

## 5. Common mistakes

- Same `<title>` on every page → poor SEO. Use `generateMetadata`.
- Forgetting `metadataBase` → broken absolute OG image URLs.
- Loading a remote image without whitelisting its host → runtime error.

## 6. Exercises

- **Beginner:** Add `keywords` to the article metadata from `meta_keywords`.
- **Intermediate:** Add `generateMetadata` to the category page (done — read it).
- **Advanced:** Validate an article's JSON-LD in Google's Rich Results Test.

## 7. Interview questions

- **Junior:** What does `generateMetadata` do?
- **Mid:** Metadata tags vs JSON-LD — what's the difference?
- **Senior:** How do canonical URLs and `metadataBase` prevent SEO problems?

← [Next.js topic index](README.md)
