# What is Tailwind CSS?

**Topic:** Tailwind CSS · **Level:** Beginner

## 1. The idea in one sentence

> Tailwind is a **utility-first** CSS framework: you style elements by composing
> small classes (`flex`, `px-4`, `text-brand`) right in the markup, instead of
> writing separate CSS files.

## 2. Before vs after

```html
<!-- traditional -->
<div class="card"></div>   <!-- + card {...} in a .css file -->

<!-- Tailwind -->
<div class="rounded-lg border p-4"></div>
```

No naming things, no switching files, no dead CSS. The classes *are* the styles.

## 3. In this project

Look at any component, e.g. the card grid on the home page:

```tsx
<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
```

`sm:` and `lg:` are **responsive prefixes** — one column on phones, two on small
screens, three on large. Responsive design without media queries.

## 4. Tailwind v4: config in CSS

v4 has no `tailwind.config.js` by default. We configure it in
[`web/src/app/globals.css`](../../web/src/app/globals.css):

```css
@import "tailwindcss";
@theme {
  --color-brand: #b91c1c;   /* becomes the `brand` color → bg-brand, text-brand */
}
```

Define a token once; use it as a utility everywhere.

## 5. Merging classes safely

When a component sets base classes *and* accepts a `className` prop, conflicts can
happen (`px-2` vs `px-4`). Our [`cn`](../../web/src/lib/utils.ts) helper
(clsx + tailwind-merge) resolves them so the last one wins.

## 6. Common mistakes

- Fighting Tailwind with lots of custom CSS — lean on utilities + `@theme`.
- Forgetting responsive prefixes → layouts that break on mobile.

## 7. Exercises

- **Beginner:** Change the brand color token and see it propagate.
- **Intermediate:** Make the article grid 4 columns on `xl`.
- **Advanced:** Add a dark-mode-only style using the existing CSS variables.

## 8. Interview questions

- **Junior:** What does "utility-first" mean?
- **Mid:** How do responsive prefixes work?
- **Senior:** Why does `tailwind-merge` exist, and when do you need it?

← [Tailwind topic index](README.md)
