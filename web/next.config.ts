import type { NextConfig } from "next";

/**
 * Next.js configuration.
 *
 * `images.remotePatterns` whitelists the hosts we're allowed to optimize images
 * from — the Django media server in dev, and any configured object-storage host.
 * `headers()` sets security response headers (CSP + the OWASP header set).
 * See teaching/12-nextjs/05-images-and-metadata.md.
 */
const isDev = process.env.NODE_ENV === "development";
const backendOrigin = process.env.NEXT_PUBLIC_BACKEND_ORIGIN ?? "http://localhost:8000";

/**
 * Build the next/image allow-list from env so production media (served by the
 * Django backend or a CDN) is optimizable without editing code. Without the
 * production backend host here, next/image refuses to serve prod media and
 * images break site-wide. Add a separate CDN/object-storage host via
 * NEXT_PUBLIC_MEDIA_HOST when USE_S3 is on.
 */
function mediaRemotePatterns() {
  const patterns: NonNullable<NextConfig["images"]>["remotePatterns"] = [
    // Local dev (Django media server).
    { protocol: "http", hostname: "localhost", port: "8000", pathname: "/media/**" },
    { protocol: "http", hostname: "127.0.0.1", port: "8000", pathname: "/media/**" },
  ];
  const hosts = [backendOrigin, process.env.NEXT_PUBLIC_MEDIA_HOST].filter(Boolean) as string[];
  for (const origin of hosts) {
    try {
      const u = new URL(origin);
      patterns.push({
        protocol: u.protocol.replace(":", "") as "http" | "https",
        hostname: u.hostname,
        port: u.port || undefined,
        pathname: "/media/**",
      });
    } catch {
      // Ignore a malformed origin rather than fail the build.
    }
  }
  // Editors can set an article's lead image to an external URL (saving server
  // disk), so next/image must be allowed to load images from any https host.
  patterns.push({ protocol: "https", hostname: "**" });
  return patterns;
}

/**
 * Content-Security-Policy. Locks down the high-value vectors — the page can't be
 * framed (clickjacking), can't load plugins/objects, and can't have its <base>
 * or form targets hijacked. `img-src`/`connect-src` stay permissive because ads
 * and aggregated stories carry images from arbitrary hosts and the client posts
 * analytics/ad beacons to the API. `script/style 'unsafe-inline'` is a pragmatic
 * trade-off for Next's inline hydration + the theme <style>; nonce-based script
 * hardening is the documented next step. Dev adds eval + ws for HMR.
 */
// Third-party script hosts we deliberately allow: Google Analytics/Tag Manager
// and Google AdSense. Without these in `script-src`, the GA loader and the
// AdSense loader are both blocked. `frameHosts` lets AdSense render its ad
// iframes (ads are served inside cross-origin frames).
const googleScriptHosts =
  "https://www.googletagmanager.com https://www.google-analytics.com " +
  "https://pagead2.googlesyndication.com https://partner.googleadservices.com " +
  "https://tpc.googlesyndication.com https://www.googletagservices.com " +
  "https://adservice.google.com";
const googleFrameHosts =
  "https://googleads.g.doubleclick.net https://tpc.googlesyndication.com https://www.google.com";
// Video hosts editors can embed in article bodies (YouTube / Vimeo players).
const videoFrameHosts =
  "https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com";

const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "img-src 'self' data: blob: https:" + (isDev ? " http:" : ""),
  "font-src 'self' data:",
  "style-src 'self' 'unsafe-inline'",
  // Turbopack's dev runtime loads chunks/workers via eval and blob: URLs.
  `script-src 'self' 'unsafe-inline' ${googleScriptHosts}` + (isDev ? " 'unsafe-eval' blob:" : ""),
  // Ads render inside cross-origin iframes; allow the Google ad + video hosts.
  `frame-src 'self' ${googleFrameHosts} ${videoFrameHosts}`,
  "worker-src 'self' blob:",
  `connect-src 'self' ${backendOrigin} https:` + (isDev ? " http: ws: wss:" : ""),
]
  .join("; ")
  .concat(isDev ? "" : "; upgrade-insecure-requests");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

const nextConfig: NextConfig = {
  // Self-contained server bundle for a small production Docker image (only
  // .next/standalone + static are shipped). See web/Dockerfile.
  output: "standalone",
  images: {
    // Next 16's image optimizer refuses to fetch upstream images that resolve to
    // a private IP (localhost/127.0.0.1/::1) as an SSRF guard. In dev our Django
    // media server *is* on localhost, so we opt in — but only in development.
    // Production media lives on a public host/CDN, so the guard stays on there.
    dangerouslyAllowLocalIP: isDev,
    remotePatterns: mediaRemotePatterns(),
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
