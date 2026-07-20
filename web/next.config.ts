import type { NextConfig } from "next";

/**
 * Next.js configuration.
 *
 * `images.remotePatterns` whitelists the hosts we're allowed to optimize images
 * from — the Django media server in dev, and any configured object-storage host.
 * See teaching/12-nextjs/05-images-and-metadata.md.
 */
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "http", hostname: "localhost", port: "8000", pathname: "/media/**" },
      { protocol: "http", hostname: "127.0.0.1", port: "8000", pathname: "/media/**" },
      // Add your production media/CDN host here.
    ],
  },
};

export default nextConfig;
