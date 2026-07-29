/**
 * Legacy `/about` — the About page is now the CMS-driven `/pages/about`.
 * Keep this path working by redirecting any old links/bookmarks.
 */
import { permanentRedirect } from "next/navigation";

// 308 permanent redirect (not a temporary 307): this is a stable legacy alias,
// so search engines should transfer link equity to /pages/about and update
// their index to the canonical URL.
export default function AboutRedirect() {
  permanentRedirect("/pages/about");
}
