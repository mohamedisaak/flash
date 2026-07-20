# What is React?

**Topic:** React · **Level:** Beginner

## 1. The idea in one sentence

> React builds UIs from **components** — reusable functions that take input
> (props) and return what the screen should look like.

## 2. Analogy

A component is a **cookie cutter**: define the shape once (`ArticleCard`), stamp
out many cookies (one per article) by passing different dough (props).

## 3. Components are just functions

```tsx
function Greeting({ name }: { name: string }) {
  return <h1>Hello, {name}</h1>;
}
```

`<Greeting name="Ada" />` renders `<h1>Hello, Ada</h1>`. The `{...}` embeds
JavaScript inside JSX (HTML-like syntax).

## 4. In this project

Everything in [`web/src/components/`](../../web/src/components/) is a component:
`ArticleCard`, `SiteHeader`, `Badge`, `Button`. Pages compose them together.

## 5. Declarative UI

You describe *what* the UI should look like for the current data; React figures
out *how* to update the DOM. You don't manually touch elements.

## 6. Interview questions

- **Junior:** What is a component?
- **Mid:** What does "declarative UI" mean?
- **Senior:** How does React decide what to re-render?

← [React topic index](README.md)
