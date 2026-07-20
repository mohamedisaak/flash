# Props & Composition

**Topic:** React · **Level:** Beginner → Intermediate

## 1. The idea in one sentence

> **Props** are the inputs you pass to a component; **composition** is building
> big UIs by nesting small components.

## 2. Props in action

[`web/src/components/article-card.tsx`](../../web/src/components/article-card.tsx)
takes a typed prop and renders it:

```tsx
export function ArticleCard({ article, priority = false }:
  { article: ArticleListItem; priority?: boolean }) { ... }
```

`priority = false` is a **default prop**. Callers write
`<ArticleCard article={a} />` or `<ArticleCard article={a} priority />`.

## 3. Spreading native props

The `Button` forwards any `<button>` attribute:

```tsx
export function Button({ variant = "primary", className, ...props }) {
  return <button className={cn(base, variants[variant], className)} {...props} />;
}
```

`{...props}` passes through `onClick`, `type`, `disabled`… so our button behaves
like a real button plus styling. This is the shadcn pattern.

## 4. Composition with `children`

Layouts and cards accept `children`:

```tsx
<Card><ArticleCard article={a} /></Card>
```

The home page composes `ArticleCard`s into a grid; `layout.tsx` composes the
header, page, and footer. Small pieces → whole site.

## 5. Common mistakes

- Passing many loose props instead of one object → hard to maintain. (We pass a
  whole `article`.)
- Forgetting a `key` when rendering a list (`articles.map`) → React warns and
  mis-updates.

## 6. Exercises

- **Beginner:** Add a `compact?: boolean` prop to `ArticleCard` that hides the
  excerpt.
- **Intermediate:** Make `Badge` accept an `href` and render a link when present.
- **Advanced:** Extract a `<Grid>` component the home and category pages share.

## 7. Interview questions

- **Junior:** What are props?
- **Mid:** Why does React need `key` on list items?
- **Senior:** When do you lift state up vs compose via children?

← [React topic index](README.md)
