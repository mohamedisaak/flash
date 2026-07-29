"use client";

/**
 * Client-side ad instrumentation for the (server-rendered) `Ad` component.
 *
 * - `AdImpression` fires one impression ping when an ad mounts in the browser.
 * - `AdLink` is the outbound anchor; it records a click before the navigation.
 *
 * Both post to the public `/ads/{id}/impression|click/` endpoints (atomic F()
 * increments on the ad's counters), which the analytics dashboard reads back as
 * lifetime totals + CTR. See teaching/41-analytics-dashboard/.
 */
import { useEffect } from "react";
import { recordAdClick, recordAdImpression } from "@/lib/analytics-beacon";

export function AdImpression({ id }: { id: number }) {
  useEffect(() => {
    recordAdImpression(id);
  }, [id]);
  return null;
}

export function AdLink({
  id,
  href,
  ariaLabel,
  children,
}: {
  id: number;
  href: string;
  ariaLabel: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener sponsored"
      aria-label={ariaLabel}
      className="block"
      onClick={() => recordAdClick(id)}
    >
      {children}
    </a>
  );
}
