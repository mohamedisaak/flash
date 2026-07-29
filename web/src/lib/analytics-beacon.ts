/**
 * First-party analytics beacons (client-only).
 *
 * Small fire-and-forget POSTs to the public analytics/ads ingest endpoints:
 * pageviews (with an anonymous per-browser session id + dwell time) and ad
 * impression/click pings. These feed the staff analytics dashboard.
 *
 * We use `fetch(..., { keepalive: true })` rather than `navigator.sendBeacon`
 * so the request carries an `application/json` body the DRF endpoints can parse
 * cross-origin (CORS is configured for the site origin); `keepalive` lets it
 * outlive an in-flight tab close. All failures are swallowed — analytics must
 * never break a page. See teaching/41-analytics-dashboard/.
 */
import { env } from "./env";
import { getAccessToken } from "./auth-store";

const SID_KEY = "flash_sid";

/** A stable, anonymous per-browser id (no PII) used to estimate unique visitors. */
export function sessionId(): string {
  if (typeof window === "undefined") return "";
  try {
    let sid = localStorage.getItem(SID_KEY);
    if (!sid) {
      sid = crypto.randomUUID?.() ?? Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem(SID_KEY, sid);
    }
    return sid;
  } catch {
    return "";
  }
}

/**
 * Fire-and-forget POST that survives a tab close via `keepalive`.
 *
 * Pass `{ auth: true }` to attach the caller's JWT (when logged in) so the
 * server can recognise — and exclude — newsroom staff. The endpoint treats a
 * missing/expired token as an anonymous visitor, so this never blocks a reader.
 */
export function beacon(
  path: string,
  body: Record<string, unknown>,
  opts: { auth?: boolean } = {},
): void {
  if (typeof window === "undefined") return;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (opts.auth) {
    const token = getAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  try {
    fetch(env.apiUrl + path, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* ignore — analytics is best-effort */
  }
}

export const recordAdImpression = (id: number) => beacon(`/ads/${id}/impression/`, {});
export const recordAdClick = (id: number) => beacon(`/ads/${id}/click/`, {});
