/**
 * Centralized, typed access to environment variables.
 *
 * Reading `process.env` in one place (with sensible defaults) means the rest of
 * the app never worries about missing/renamed vars. See
 * teaching/12-nextjs/02-config-and-data-fetching.md.
 */
export const env = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1",
  backendOrigin: process.env.NEXT_PUBLIC_BACKEND_ORIGIN ?? "http://localhost:8000",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",

  /**
   * Google AdSense. Entirely optional: when `client` is empty (the default),
   * nothing about AdSense loads and ad slots keep their existing behaviour
   * (house ad, else a neutral placeholder). Set these to switch on AdSense as
   * the fallback for any slot that has no house ad configured.
   *
   * - `client`: your publisher ID, e.g. "ca-pub-1234567890123456".
   * - `slots.*`: the ad-unit slot ID for each on-page placement (from the
   *   AdSense dashboard → Ads → By ad unit). A slot left empty simply means
   *   "no AdSense here" for that placement.
   */
  adsense: {
    client: process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? "",
    /**
     * Auto Ads: let Google place ads **anywhere on the page** (anchor, in-article,
     * side rails, etc.) in addition to your named slots. Set
     * NEXT_PUBLIC_ADSENSE_AUTO_ADS=true AND turn Auto ads on for the site in the
     * AdSense dashboard. With this on, an empty slot that has no configured
     * AdSense unit collapses (renders nothing) so Auto Ads / page flow can use
     * the space, instead of showing the neutral placeholder.
     */
    autoAds: (process.env.NEXT_PUBLIC_ADSENSE_AUTO_ADS ?? "").toLowerCase() === "true",
    slots: {
      header: process.env.NEXT_PUBLIC_ADSENSE_SLOT_HEADER ?? "",
      sidebar: process.env.NEXT_PUBLIC_ADSENSE_SLOT_SIDEBAR ?? "",
      in_content: process.env.NEXT_PUBLIC_ADSENSE_SLOT_IN_CONTENT ?? "",
      mobile: process.env.NEXT_PUBLIC_ADSENSE_SLOT_MOBILE ?? "",
      popup: process.env.NEXT_PUBLIC_ADSENSE_SLOT_POPUP ?? "",
    } as Record<string, string>,
  },
};
