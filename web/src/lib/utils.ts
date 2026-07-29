import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * `cn` merges Tailwind class strings intelligently: clsx handles conditional
 * classes, tailwind-merge resolves conflicts (e.g. "px-2 px-4" -> "px-4"). This
 * is the standard shadcn/ui helper. See teaching/16-shadcn/01-what-is-shadcn.md.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Absolute-ize a backend media path (e.g. "/media/x.jpg") for <Image>. */
export function mediaUrl(path: string | null, backendOrigin: string): string | null {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return backendOrigin.replace(/\/$/, "") + path;
}

/** Human-friendly date, e.g. "9 Aug 2027". */
export function formatDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Validate a hex colour (#rgb / #rrggbb / #rrggbbaa). Returns the fallback for
 * anything else — important because these values come from the admin panel and
 * get injected into a raw <style> tag, so we never want to pass arbitrary text.
 */
export function safeColor(value: string | null | undefined, fallback: string): string {
  return value && /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(value.trim())
    ? value.trim()
    : fallback;
}

/** Lighten (positive) or darken (negative) a #rrggbb colour by a percentage. */
export function shade(hex: string, percent: number): string {
  let h = hex.replace("#", "");
  if (h.length === 3)
    h = h
      .split("")
      .map((c) => c + c)
      .join("");
  if (h.length !== 6) return hex;
  const num = parseInt(h, 16);
  const amt = Math.round(2.55 * percent);
  const clamp = (v: number) => Math.max(0, Math.min(255, v));
  const r = clamp((num >> 16) + amt);
  const g = clamp(((num >> 8) & 0xff) + amt);
  const b = clamp((num & 0xff) + amt);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}
