# Accessibility Report (SEO-relevant)

Accessibility and SEO overlap heavily: semantic HTML, heading order, descriptive
link text, and image `alt` all help both screen readers and crawlers. This audit
focused on the accessibility signals that affect crawl/understanding; it did not
redesign UI.

---

## Verified good (no change needed)

| Area | Finding |
|---|---|
| **Landmarks** | Site layout uses `<header>` (`SiteHeader`), `<main>`, `<footer>` (`SiteFooter`); article content is in `<article>`. Proper document outline. |
| **H1 per page** | Each public page renders exactly one `<h1>` (home hero/section, article title, category name, author name, FAQ heading, page title). No multiple-H1 or missing-H1 issues found. |
| **Image alt** | `next/image` usages pass `alt` — article hero uses `image_caption || title`; list/related/author/gallery images use the item title/caption. |
| **Image dimensions** | `fill` + aspect-ratio containers reserve space (no layout shift; good for AT and CLS). |
| **Link text** | Internal links use descriptive text (titles, category/author names) rather than "click here". |
| **Language** | `<html lang="en">` set on the root. |
| **Color/theme** | Theme colors are admin-configurable; `theme-color` meta added. |
| **Emoji meta icons** | Decorative emoji in the article meta row (`👤`, `🗂`, `🕒`, `👁`) are marked `aria-hidden` — correct (not announced). |

---

## Improvements made in this audit

| Change | Benefit |
|---|---|
| Added `aria-label="Breadcrumb"` to the **author** page breadcrumb `<nav>` | Screen readers announce the breadcrumb landmark; matches the article/category pattern |
| Added crawlable breadcrumb trail on the author page | Both AT and crawlers get the hierarchy (paired with BreadcrumbList JSON-LD) |
| `viewport` with `initial-scale=1` (no `maximum-scale`/`user-scalable=no`) | Users can zoom — pinch-zoom is **not** disabled (WCAG 1.4.4) |

---

## Recommendations (not applied — visible-UI changes, out of scope)

| # | Item | WCAG |
|---|---|---|
| A1 | Add `aria-label="Breadcrumb"` to the **article** and **category** breadcrumb `<nav>`s too (author now has it) | 1.3.1 |
| A2 | Give the FAQ `<details>` a consistent expand/collapse affordance and ensure keyboard focus styles are visible | 2.1.1 / 2.4.7 |
| A3 | Ensure tag "pills" (`bg-gray-500/90` text-white) meet 4.5:1 contrast; verify brand/accent on white | 1.4.3 |
| A4 | Add a "Skip to content" link before the header | 2.4.1 |
| A5 | Confirm the mobile nav toggle exposes `aria-expanded`/`aria-controls` | 4.1.2 |

These are low-risk but touch visible components; flagged for a dedicated a11y
pass rather than bundled into this SEO-focused change set.

---

## Notes

- The article body is injected via `dangerouslySetInnerHTML` from CMS/Tiptap
  content; heading levels **inside** article bodies depend on editor discipline.
  Recommend the editor enforce starting body headings at `<h2>` (the page `<h1>`
  is the title) to preserve the outline. Not enforceable from this layer.
- No accessibility regressions were introduced; the only DOM additions are an
  ARIA-labelled breadcrumb nav and inline JSON-LD `<script>` tags (invisible to
  AT).
