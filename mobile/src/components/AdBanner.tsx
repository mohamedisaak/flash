/**
 * A responsive AdMob banner.
 *
 * Renders nothing on runtimes without the native AdMob module (Expo Go, web),
 * so it's safe to drop into any screen. The native module is loaded lazily via
 * `getBannerAd()` (see lib/ads.ts) — never imported at module scope, because
 * that would crash unsupported runtimes at launch. Uses an anchored adaptive
 * banner, which sizes itself to the device width (the recommended format).
 *
 * See teaching/42-monetization/ads-explained.md.
 */
import type { ComponentType } from "react";
import { View } from "react-native";

import { adsSupported, bannerAdUnitId, getBannerAd } from "@/lib/ads";

export function AdBanner() {
  if (!adsSupported) return null;

  const ads = getBannerAd();
  if (!ads) return null;

  const BannerAd = ads.BannerAd as ComponentType<{
    unitId: string;
    size: string;
    requestOptions?: { requestNonPersonalizedAdsOnly?: boolean };
  }>;

  return (
    <View className="my-3 items-center">
      <BannerAd
        unitId={bannerAdUnitId()}
        size={ads.BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{ requestNonPersonalizedAdsOnly: false }}
      />
    </View>
  );
}
