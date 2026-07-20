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
