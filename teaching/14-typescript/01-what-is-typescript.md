# What is TypeScript?

**Topic:** TypeScript · **Level:** Beginner

## 1. The idea in one sentence

> TypeScript is JavaScript plus **types** — labels on your data that the compiler
> checks, catching bugs before you run the code.

## 2. Why it matters

```ts
function readingTime(a: ArticleListItem) { return a.redaing_time; }
//                                                  ^^^^^^^^^^^^ typo → compile error
```

Plain JS would fail silently at runtime (`undefined`). TypeScript flags it while
you type. On a big app across web + mobile, this prevents whole classes of bugs.

## 3. The basics

```ts
let title: string = "Hello";
let views: number = 0;
let live: boolean = true;
interface Tag { id: number; name: string; }   // a shape
```

## 4. In this project

The whole `web/` app is TypeScript. `pnpm typecheck` (`tsc --noEmit`) verifies
types without producing output — we ran it as a build gate.

## 5. Interview questions

- **Junior:** What does TypeScript add to JavaScript?
- **Mid:** What is an `interface`?
- **Senior:** How does structural typing differ from nominal typing?

← [TypeScript topic index](README.md)
