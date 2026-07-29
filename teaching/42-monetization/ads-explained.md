# Third-party ads: Google AdSense (web) & AdMob (mobile)

This lesson explains how the project serves **third-party ads** without throwing
away the existing **house-ad** system, and how to turn them on.

- **Web** → Google **AdSense** (ads on a website).
- **Mobile** → Google **AdMob** (ads inside a native app). AdSense and AdMob are
  siblings but **not interchangeable**: AdSense is web-only, AdMob is app-only.

Both are wired to be **opt-in and safe by default**: with no configuration,
nothing loads and the apps behave exactly as before.

---

## 1. The mental model

The site already had a **self-hosted** ad system: `Advertisement` rows in the
database, rendered by `<Ad placement="…">`. There are three web slots:

| `placement` | Where |
|---|---|
| `header` | full-width banner at the top of every page |
| `sidebar` | top of the right sidebar (article/category/author/home) |
| `in_content` | mid-page banner on the home page |

**Key idea — house ad first, network ad as fallback.** For each slot:

```
house ad configured?  ── yes ─►  show YOUR ad (image/HTML from the DB)
        │
        no
        ▼
AdSense configured for this slot?  ── yes ─►  show an AdSense unit
        │
        no
        ▼
show a neutral "Advertisement" placeholder (unchanged behaviour)
```

So AdSense **does not** hijack your slots — it only fills the ones you haven't
sold yourself. You keep 100% of house-ad revenue and let AdSense backfill the
rest.

---

## 2. Web / AdSense

### Files
- `web/src/lib/env.ts` — `env.adsense.{client, slots}` (all from `NEXT_PUBLIC_*`).
- `web/src/components/public/adsense-unit.tsx` — one `<ins class="adsbygoogle">`
  unit (client component; calls `adsbygoogle.push({})` once on mount).
- `web/src/components/public/ad.tsx` — the fallback branch (diagram above).
- `web/src/app/layout.tsx` — loads the AdSense script **once**, only when a
  publisher id is set.
- `web/next.config.ts` — CSP updated to allow Google ad + analytics hosts.

### Two things that make AdSense actually work here

1. **The loader script must be global, not inline.** Browsers do **not** execute
   `<script>` inserted via `dangerouslySetInnerHTML`. So the AdSense loader is
   added with `next/script` in the root layout; each slot renders only the
   `<ins>` tag and calls `push({})` from a React effect.

2. **Content-Security-Policy must allow Google.** The project ships a strict CSP.
   Ads are blocked unless these hosts are allowed (already done in
   `next.config.ts`):
   - `script-src`: `pagead2.googlesyndication.com`, `googletagservices.com`, …
   - `frame-src`: `googleads.g.doubleclick.net`, `tpc.googlesyndication.com`, … —
     because **ads render inside cross-origin iframes**.
   (The same change also unblocked the existing Google Analytics script.)

### Turn it on
1. Get approved at adsense.google.com; note your publisher id `ca-pub-…`.
2. Create display ad units (one per slot you want) → copy each **slot id**.
3. Set in `web/.env.local`:
   ```
   NEXT_PUBLIC_ADSENSE_CLIENT=ca-pub-XXXXXXXXXXXXXXXX
   NEXT_PUBLIC_ADSENSE_SLOT_SIDEBAR=1234567890
   NEXT_PUBLIC_ADSENSE_SLOT_IN_CONTENT=0987654321
   # header/mobile/popup optional
   ```
4. Deploy. Slots without a house ad now serve AdSense. Leave `CLIENT` blank to
   keep ads off entirely.

### Auto Ads + ad units together ("ads anywhere, except my used slots")

The project supports **both** AdSense modes at once:

- **Ad units (manual)** — the `<ins>` we render in the header/sidebar/in-content
  slots. These fill a slot *only when it has no house ad*.
- **Auto Ads** — Google's ML places ads **anywhere on the page** (anchor,
  in-article, side rails…), decided by Google, not by us.

The **same loader script** enables both — there's no extra script for Auto Ads.
To switch Auto Ads on:

1. In the AdSense dashboard: **Ads → By site → your site → Auto ads = On** (pick
   the formats you want: anchor, in-page, vignette…).
2. Set `NEXT_PUBLIC_ADSENSE_AUTO_ADS=true` in the web env.

How this maps to "advertise anywhere, but not on my used ad space":

| Situation | What shows |
|---|---|
| A slot **has a house ad** | your house ad (Auto Ads avoids existing ad regions, so it won't stack on it) |
| A slot is **empty + has a unit id** | an AdSense manual unit fills that slot |
| A slot is **empty + no unit id** (Auto Ads on) | the slot **collapses** (renders nothing) so Auto Ads / the page can use the space — no grey placeholder |
| Everywhere else on the page | Auto Ads places ads at Google's discretion |

**Honest limitation:** *manual* units never touch your used slots (that's
guaranteed by our code — a house ad always wins its slot). *Auto Ads* placement,
however, is controlled by Google's algorithm: it automatically avoids existing ad
units and normally inserts between content blocks rather than over your
creatives, but AdSense does **not** offer a hard per-`<div>` "exclude this area"
switch (that's a Google Ad Manager feature). If an Auto Ads format ever crowds
your house ads, turn that format off in the dashboard.

> **Mobile note:** "anywhere" is a *web/AdSense* concept — Google scans the web
> page's DOM. The native mobile app has no page to scan, so **AdMob** only shows
> ads where you place them (`<AdBanner/>`, interstitials). There's no "auto ads
> anywhere" for the app.

---

## 3. Mobile / AdMob

AdMob is a **native SDK**. Consequences:

- It runs in a **dev build / EAS build**, **never in Expo Go**, and not on web.
- Everything is guarded by `adsSupported` in `mobile/src/lib/ads.ts`, so the app
  stays runnable everywhere — the banner simply renders nothing where AdMob
  isn't available.

### Files
- `mobile/package.json` — `react-native-google-mobile-ads`.
- `mobile/app.json` — AdMob **app** ids under the top-level
  `react-native-google-mobile-ads` key (Expo auto-applies the library's config
  plugin during prebuild).
- `mobile/src/lib/env.ts` — `env.admob.*` unit ids (`EXPO_PUBLIC_*`).
- `mobile/src/lib/ads.ts` — `initAds()`, `adsSupported`, unit-id resolvers.
- `mobile/src/components/AdBanner.tsx` — anchored adaptive banner; renders null
  when unsupported.
- `mobile/src/app/_layout.tsx` — `initAds()` on startup.
- `mobile/src/app/(tabs)/index.tsx` — an `<AdBanner/>` in the feed header.

### Test ids by default (important)
Clicking your **own live** ads is invalid traffic and can get you banned. So the
code falls back to **Google's official TEST unit ids** when no real id is set,
and `app.json` currently uses **TEST app ids**. These always show a placeholder
"Test Ad" and never bill anyone — perfect for development.

### Turn it on (production)
1. `npx expo install react-native-google-mobile-ads` (already in `package.json`).
2. In AdMob, create an app (per platform) and banner/interstitial units.
3. Put your real **app ids** in `mobile/app.json`:
   ```json
   "react-native-google-mobile-ads": {
     "androidAppId": "ca-app-pub-REAL~ANDROID",
     "iosAppId": "ca-app-pub-REAL~IOS"
   }
   ```
4. Put your real **unit ids** in `mobile/.env`:
   ```
   EXPO_PUBLIC_ADMOB_BANNER_UNIT_ID=ca-app-pub-REAL/BANNER
   ```
5. Build a dev client and run on a device:
   ```
   npx expo prebuild
   npx expo run:android   # or run:ios, or an EAS build
   ```
   (Expo Go will show no ads — that's expected.)
6. iOS: AdMob adds the required `SKAdNetworkItems`; App Tracking Transparency
   copy comes from `userTrackingUsageDescription` in `app.json`.

---

## 4. Common mistakes

- **Expecting AdSense to auto-fill your slots without config.** It won't — slots
  show house ad → placeholder until you set the publisher id + slot ids.
- **Pasting the AdSense `<script>` into the DB HTML field.** It won't run
  (inserted scripts don't execute) and the CSP would block it. Use the env
  config path instead.
- **Testing AdMob in Expo Go.** No native module → no ads. Use a dev build.
- **Clicking your own real ads.** Use test ids in development (the default here).
- **Forgetting the CSP.** Any strict CSP will silently block ads; allow the
  Google hosts (already done for this project).

---

## Exercises

1. **(Beginner)** Add an AdSense slot id for `header` only, and confirm the
   sidebar still shows the placeholder (no slot id) while the header serves an
   ad. Which env var controls each?
2. **(Intermediate)** Give the `in_content` AdSense unit a fixed-height wrapper
   to eliminate layout shift (CLS). Why does a responsive `data-ad-format="auto"`
   unit risk CLS above the fold?
3. **(Advanced)** Add an AdMob **interstitial** shown once per session after the
   user opens their 3rd article. Use `interstitialAdUnitId()` and guard with
   `adsSupported`. Where should the counter live so it survives navigation but
   resets on app restart?

## Quiz

1. Why must the AdSense loader be added with `next/script` rather than injected
   as HTML into an ad record?
2. What does `adsSupported` protect against in the mobile app, and how does it
   detect an unsupported runtime?
3. Which CSP directive must list `googleads.g.doubleclick.net`, and why that
   directive specifically?
4. With a house ad **and** AdSense both configured for the sidebar, which one
   shows, and why?

<details><summary>Answers</summary>

1. Browsers don't execute `<script>` inserted via `innerHTML`/`dangerouslySetInnerHTML`,
   and the CSP blocks external inline injection; `next/script` loads it as a real,
   allow-listed external script.
2. It prevents rendering the native `BannerAd` where the AdMob native module is
   absent (Expo Go, web), which would otherwise crash; it checks
   `Platform.OS !== "web"` and `Constants.executionEnvironment !== "storeClient"`.
3. `frame-src` — AdSense/AdMob-web render the ad creative inside a cross-origin
   `<iframe>`, so the frame host must be allowed.
4. The **house ad** — `ad.tsx` only falls back to AdSense when there is no house
   ad for the placement, so you never give away inventory you've sold.
</details>
