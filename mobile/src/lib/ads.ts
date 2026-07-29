/**
 * Google AdMob wiring for the mobile app.
 *
 * AdMob is a **native** SDK: it only works in a custom dev build / EAS build,
 * **not** in Expo Go, and not on web.
 *
 * Why the module is loaded lazily (this matters): importing
 * `react-native-google-mobile-ads` eagerly evaluates a native TurboModule
 * (`TurboModuleRegistry.getEnforcing(...)`) at import time, which **throws** when
 * the native module isn't registered — i.e. in Expo Go and on web. A top-level
 * `import` would therefore crash the app at launch there. So we never import it
 * at module scope: `loadAdsModule()` `require`s it only when `adsSupported` is
 * true (a real native build), wrapped in try/catch. On unsupported runtimes the
 * helpers no-op and `<AdBanner>` renders nothing, keeping the app runnable
 * everywhere.
 *
 * Unit IDs fall back to Google's official TEST units when no real id is
 * configured (see env), so development never risks invalid-traffic strikes.
 *
 * Setup (once): `npx expo install react-native-google-mobile-ads`, set the app
 * IDs in app.json, then build a dev client (`npx expo prebuild` + `expo run:*`
 * or an EAS build). See teaching/42-monetization/ads-explained.md.
 */
import Constants from "expo-constants";
import { Platform } from "react-native";

import { env } from "./env";

/**
 * True only where the native AdMob module can exist. Expo Go reports
 * `executionEnvironment === "storeClient"`; web has no native module at all.
 */
export const adsSupported =
  Platform.OS !== "web" && Constants.executionEnvironment !== "storeClient";

// Minimal shape we use off the native module (kept loose on purpose — the module
// is only ever present at runtime in a native build).
type AdsModule = {
  default: () => { initialize: () => Promise<unknown> };
  BannerAd: unknown;
  BannerAdSize: Record<string, string>;
  TestIds: Record<string, string>;
};

let cached: AdsModule | null = null;
let attempted = false;

/** Require the native module, but only on a runtime that supports it. */
function loadAdsModule(): AdsModule | null {
  if (!adsSupported) return null;
  if (attempted) return cached;
  attempted = true;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    cached = require("react-native-google-mobile-ads") as AdsModule;
  } catch {
    cached = null; // module present in JS but native side not linked
  }
  return cached;
}

let initialized = false;

/** Initialise the AdMob SDK once, at app start. Safe to call anywhere. */
export async function initAds(): Promise<void> {
  const mod = loadAdsModule();
  if (!mod || initialized) return;
  initialized = true;
  try {
    await mod.default().initialize();
  } catch {
    // Native module missing (e.g. Expo Go) — ads simply stay off.
  }
}

/** The banner unit id to request: your configured one, else Google's test id. */
export function bannerAdUnitId(): string {
  return env.admob.bannerUnitId || loadAdsModule()?.TestIds?.BANNER || "";
}

/** The interstitial unit id (for a future full-screen ad), test id by default. */
export function interstitialAdUnitId(): string {
  return env.admob.interstitialUnitId || loadAdsModule()?.TestIds?.INTERSTITIAL || "";
}

/** The banner component + size enum, or null when ads aren't supported. */
export function getBannerAd(): { BannerAd: unknown; BannerAdSize: Record<string, string> } | null {
  const mod = loadAdsModule();
  if (!mod) return null;
  return { BannerAd: mod.BannerAd, BannerAdSize: mod.BannerAdSize };
}
