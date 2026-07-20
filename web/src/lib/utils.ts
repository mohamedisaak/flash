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
