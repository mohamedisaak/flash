"use client";

/**
 * Records one pageview per public-site page visit, with dwell time.
 *
 * Mounted once in the site layout. On each route change it "flushes" the page
 * being left — sending its path, referrer, anonymous session id and seconds
 * spent — and arms a fresh timer for the new path. A `visibilitychange`/
 * `pagehide` listener flushes the final page when the tab is closed. The flush
 * is guarded so a page is only counted once. Server-side, the path is enough to
 * attribute views to an article (see analytics services `_top_articles`).
 *
 * See teaching/41-analytics-dashboard/.
 */
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { beacon, sessionId } from "@/lib/analytics-beacon";

export function PageViewTracker() {
  const pathname = usePathname();
  const pathRef = useRef(pathname);
  const startRef = useRef(0); // set to Date.now() in the effect (kept pure during render)
  const sentRef = useRef(false);

  useEffect(() => {
    // A new path is showing: reset the timer and re-arm the beacon.
    pathRef.current = pathname;
    startRef.current = Date.now();
    sentRef.current = false;

    const flush = () => {
      if (sentRef.current) return;
      sentRef.current = true;
      const seconds = Math.min(3600, Math.round((Date.now() - startRef.current) / 1000));
      beacon(
        "/analytics/pageview/",
        {
          path: pathRef.current,
          referrer: document.referrer || "",
          session_key: sessionId(),
          read_seconds: seconds,
        },
        { auth: true }, // let the server exclude logged-in staff from visitors
      );
    };

    const onVisibility = () => {
      if (document.visibilityState === "hidden") flush();
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", flush);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", flush);
      flush(); // client-side navigation away from this path
    };
  }, [pathname]);

  return null;
}
