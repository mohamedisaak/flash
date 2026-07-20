# What is shadcn/ui?

**Topic:** shadcn/ui · **Level:** Beginner → Intermediate

## 1. The idea in one sentence

> shadcn/ui is not a component library you install — it's a set of **components
> you copy into your project and own**, built on Tailwind, so you can edit them
> freely.

## 2. Why "own the code"?

Traditional UI libraries (e.g. a `<Button>` from npm) are hard to customize and
lock you to their API. shadcn's philosophy: the component lives in *your* repo as
plain code you can read and change. No black box.

## 3. In this project

Our primitives in [`web/src/components/ui/`](../../web/src/components/ui/) follow
the shadcn pattern — small, Tailwind-styled, `cn`-merged, prop-spreading:

```tsx
export function Button({ variant = "primary", className, ...props }) {
  return <button className={cn(base, variants[variant], className)} {...props} />;
}
```

`Badge`, `Button`, and `Card` are hand-rolled in this style. (The real shadcn CLI
generates fancier versions; the idea is identical.)

## 4. The building blocks shadcn relies on

- **Tailwind** for styling.
- **`cn`** (clsx + tailwind-merge) to combine base + override classes.
- **Prop spreading** (`...props`) so components behave like the native element.

## 5. Common mistakes

- Treating these as untouchable library code — the whole point is that you edit
  them.
- Overriding styles with `!important` instead of passing `className` (which `cn`
  merges cleanly).

## 6. Exercises

- **Beginner:** Add a `"ghost"` variant to `Button`.
- **Intermediate:** Build a `<Skeleton>` loading placeholder component.
- **Advanced:** Add a `size` prop (`sm`/`md`/`lg`) to `Button` using a variants
  map.

## 7. Interview questions

- **Junior:** How is shadcn/ui different from a normal component library?
- **Mid:** What does `{...props}` achieve on a UI primitive?
- **Senior:** Trade-offs of "own the code" components vs an external design system?

← [shadcn topic index](README.md)
