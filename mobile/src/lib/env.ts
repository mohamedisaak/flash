/**
 * Where the app finds the Django API.
 *
 * `localhost` means different things per platform: it works on the iOS
 * simulator, but an Android emulator reaches the host machine at 10.0.2.2, and a
 * *physical* device needs your computer's LAN IP. Set `EXPO_PUBLIC_API_URL` in
 * a `.env` file (see .env.example) to your machine's IP when testing on a phone,
 * e.g. EXPO_PUBLIC_API_URL=http://192.168.1.144:8000/api/v1
 *
 * See teaching/20-expo/ (env & config).
 */
import { Platform } from "react-native";

const host = Platform.OS === "android" ? "http://10.0.2.2:8000" : "http://localhost:8000";

export const env = {
  apiUrl: process.env.EXPO_PUBLIC_API_URL ?? `${host}/api/v1`,
  backendOrigin: process.env.EXPO_PUBLIC_BACKEND_ORIGIN ?? host,
  // Public website origin, used to build share links to an article.
  siteUrl: process.env.EXPO_PUBLIC_SITE_URL ?? "http://localhost:3000",

  /**
   * Google AdMob ad-unit IDs. Leave empty (the default) to use Google's
   * official TEST units at runtime — safe to display and tap, never bills your
   * account. Set the real unit IDs for production via EXPO_PUBLIC_* env vars.
   * The AdMob *app* IDs live in app.json (they're baked in at build time).
   * See teaching/42-monetization/ads-explained.md.
   */
  admob: {
    bannerUnitId: process.env.EXPO_PUBLIC_ADMOB_BANNER_UNIT_ID ?? "",
    interstitialUnitId: process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_UNIT_ID ?? "",
  },
};
