# 21 · NativeWind

**Status:** 🟢 Built — see [`mobile/`](../../mobile/).

**NativeWind** brings Tailwind CSS's utility classes to React Native: you write
`className="..."` on native components and it compiles to RN styles. It means the
mobile app and the [website](../15-tailwind/) share the *same styling vocabulary*
(`p-3`, `rounded-lg`, `text-brand`).

## 1. Why utility classes on native?

Plain RN styling uses `StyleSheet.create({...})` objects — verbose and
disconnected from the web's Tailwind. NativeWind lets you write:

```tsx
<View className="mx-3 mb-3 flex-row gap-3 rounded-xl bg-white p-3 shadow-sm">
```

instead of a hand-written style object, and reuse the brand tokens
(`bg-brand`, `text-accent`) defined once in `tailwind.config.js`.

## 2. The four wiring pieces (what we set up)

NativeWind needs a small amount of build config. In `mobile/`:

1. **`tailwind.config.js`** — the content globs + brand colours, using the
   NativeWind preset:
   ```js
   presets: [require("nativewind/preset")],
   theme: { extend: { colors: { brand: "#4f63d2", accent: "#1dc175" } } },
   ```
2. **`babel.config.js`** — teaches Babel that `className` is a real prop:
   ```js
   presets: [["babel-preset-expo", { jsxImportSource: "nativewind" }], "nativewind/babel"],
   ```
3. **`metro.config.js`** — runs the CSS through Metro:
   ```js
   module.exports = withNativeWind(config, { input: "./src/global.css" });
   ```
4. **`src/global.css`** with the `@tailwind` directives, imported once at the top
   of the root layout: `import "../global.css";`

Plus `nativewind-env.d.ts` (`/// <reference types="nativewind/types" />`) so
TypeScript knows every RN component accepts `className`, and a
`declare module "*.css";` so the CSS import type-checks.

## 3. What works, and the gotchas

- Core RN components (`View`, `Text`, `Pressable`, `ScrollView`, `TextInput`)
  accept `className` out of the box.
- **Pressed state:** `active:opacity-70` instead of web's `hover:`.
- **Not every web class exists** — there's no cascade, no `hover`, and layout is
  flexbox-only (RN defaults to `flex-direction: column`, unlike web's `row`).
- **Third-party components** (like `expo-image`) may not forward `className`; we
  style those with the `style` prop instead — see `ArticleCard.tsx`, which uses
  `className` on the `View`/`Text` but `style` on the `<Image>`.

## 4. Verifying config without a simulator

A subtle babel/metro misconfig won't show up in `tsc` — it fails at bundle time.
`npx expo export -p ios` runs the real Metro+NativeWind pipeline and produces a
JS bundle; if that succeeds, your styling config is wired correctly. (That's how
this app was verified — 1,565 modules bundled clean.)

## Exercises

- **Beginner:** Add a `text-brand` heading to the Saved empty state.
- **Intermediate:** Add a `dark:` variant to `ArticleCard` and toggle color
  scheme (hint: NativeWind reads the system scheme).
- **Advanced:** Extract the repeated card styling into a `cardClass` constant and
  discuss the trade-off vs. a `<Card>` component.

## Quiz

1. Which config file makes `className` a valid prop, and how?
2. Why do we style `<Image>` (expo-image) with `style` but `<View>` with
   `className`?
3. Why can `tsc` pass while the app still fails to style? How do you catch that?

<details><summary>Answers</summary>

1. `babel.config.js` — `jsxImportSource: "nativewind"` + the `nativewind/babel`
   preset rewrite `className` into styles.
2. `expo-image` doesn't forward `className` to a styled native view; core RN
   components do (via NativeWind's interop).
3. NativeWind wiring is a build-time concern; run `npx expo export` (real Metro
   bundle) to catch babel/metro mistakes.
</details>

← Back to the [curriculum index](../README.md)
