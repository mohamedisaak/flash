/**
 * A single Google AdSense display unit (`<ins class="adsbygoogle">`).
 *
 * Client component: after the `<ins>` is in the DOM it calls
 * `(window.adsbygoogle = …).push({})` once to ask the (globally loaded) AdSense
 * script to fill this slot. The loader script itself is injected once in the
 * root layout — only when a publisher ID is configured.
 *
 * Renders nothing unless BOTH a publisher `client` and a `slot` id are set, so
 * an unconfigured site (or an unconfigured placement) shows no empty ad frame.
 * See teaching/42-monetization/ads-explained.md.
 */
"use client";

import { useEffect, useRef } from "react";
import { env } from "@/lib/env";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

export function AdSenseUnit({
  slot,
  label = "Advertisement",
  format = "auto",
  responsive = true,
  style,
}: {
  /** AdSense ad-unit slot id (data-ad-slot). */
  slot: string;
  label?: string;
  /** data-ad-format; "auto" is a responsive display unit. */
  format?: string;
  responsive?: boolean;
  style?: React.CSSProperties;
}) {
  const pushed = useRef(false);

  useEffect(() => {
    if (pushed.current || !env.adsense.client || !slot) return;
    pushed.current = true;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // AdSense not loaded / blocked (e.g. an ad blocker) — fail silently.
    }
  }, [slot]);

  if (!env.adsense.client || !slot) return null;

  return (
    <ins
      className="adsbygoogle"
      style={style ?? { display: "block" }}
      data-ad-client={env.adsense.client}
      data-ad-slot={slot}
      data-ad-format={format}
      data-full-width-responsive={responsive ? "true" : "false"}
      aria-label={label}
    />
  );
}
