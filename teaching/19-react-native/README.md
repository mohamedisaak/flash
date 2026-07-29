# 19 · React Native

**Status:** 🟢 Built — see [`mobile/`](../../mobile/).

React Native (RN) lets you build a **real native mobile app** using React. You
write components in TypeScript/JSX, and RN renders them to actual iOS/Android
native views (not a webview). The Flash mobile app is our worked example.

## 1. It's React, with different primitives

You already know React (see [13-react](../13-react/)). RN keeps the model —
components, props, state, hooks — but swaps the *primitives*:

| Web (DOM) | React Native |
|---|---|
| `<div>` | `<View>` |
| `<p>`, `<span>` | `<Text>` (all text **must** be inside `<Text>`) |
| `<img>` | `<Image>` (we use `expo-image`) |
| `<button>`, `onClick` | `<Pressable>`, `onPress` |
| `<input>` | `<TextInput>` |
| scrolling is automatic | `<ScrollView>` / `<FlatList>` (explicit) |
| CSS files / classes | `StyleSheet` objects — or **NativeWind** ([21](../21-nativewind/)) |

```tsx
// mobile/src/components/BreakingBanner.tsx (trimmed)
<Pressable className="flex-row items-center gap-2 rounded-lg bg-red-600 p-3">
  <Text className="text-sm font-semibold text-white">{article.title}</Text>
</Pressable>
```

Two rules that trip up web devs:
- **Text only lives in `<Text>`.** A bare string inside a `<View>` crashes.
- **There is no cascade.** Styles apply to one element; no inheritance (except
  `<Text>` nesting), and no `className` unless you add NativeWind.

## 2. Lists: `FlatList`, not `.map()`

On the web you often `.map()` an array into the DOM. On mobile that renders every
row at once and janks. RN's `FlatList` **virtualises** — it mounts only the rows
on screen and recycles them as you scroll. Every feed in Flash uses it:

```tsx
// mobile/src/app/(tabs)/index.tsx
<FlatList
  data={rest}
  keyExtractor={(a) => String(a.id)}
  renderItem={({ item }) => <ArticleCard article={item} />}
  ListHeaderComponent={<HeroCard article={featured} />}
  refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} />}
/>
```

`ListHeaderComponent` puts the hero/breaking banner *inside* the scroll (so they
scroll away), and `refreshControl` gives native pull-to-refresh for free.

## 3. Touch, not click

Use `<Pressable>` with `onPress`; style the pressed state with `active:opacity-70`
(NativeWind). There is no hover — don't design for it.

## 4. Platform differences are normal

`localhost` on a phone means the *phone itself*, not your dev machine — which is
why [`env.ts`](../../mobile/src/lib/env.ts) picks a different host per platform.
Reach for `Platform.OS` (`"ios"` | `"android"` | `"web"`) when behaviour differs.

## Exercises

- **Beginner:** Add a `reading_time` pill to `ArticleCard` with a `<View>` +
  `<Text>`. Why can't the number sit directly inside the `<View>`?
- **Intermediate:** Add `onEndReached` to the Home `FlatList` to load page 2
  (infinite scroll). What does virtualisation save you here?
- **Advanced:** Swap the emoji tab icons in `(tabs)/_layout.tsx` for
  `@expo/vector-icons`, changing the glyph when `focused`.

## Quiz

1. Why must every string be wrapped in `<Text>`?
2. What does `FlatList` do that `array.map()` doesn't?
3. On a physical phone, why doesn't `http://localhost:8000` reach your backend?

<details><summary>Answers</summary>

1. RN has no text node type; only `<Text>` lays out and renders glyphs.
2. It virtualises — mounts only visible rows and recycles them.
3. `localhost` resolves to the phone; use your machine's LAN IP (`.env.example`).
</details>

## Where next

- [20-expo](../20-expo/) — toolchain + file-based routing.
- [21-nativewind](../21-nativewind/) — Tailwind classes on native.
- [22-mobile-architecture](../22-mobile-architecture/) — how the app is wired.

← Back to the [curriculum index](../README.md)
