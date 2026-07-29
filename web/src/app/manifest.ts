/**
 * Web App Manifest (served at /manifest.webmanifest).
 *
 * Gives the site an installable identity and declares theme colours so mobile
 * browsers render the address bar / task-switcher in the brand colour — part of
 * the "Page Experience" signal set. Kept minimal and static; brand colours track
 * the CMS theme defaults. See teaching/12-nextjs/05-images-and-metadata.md.
 */
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Flash News",
    short_name: "Flash",
    description: "Breaking news, politics, business, sport and more.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#4f63d2",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
