/**
 * Pure helpers mapping between the article form and the API payload.
 * Kept framework-free so they're trivially testable.
 */
import type { ArticleFormValues } from "@/components/dashboard/article-form";
import type { ArticleWritePayload } from "./dashboard-types";

/** Convert form values into the API write payload (handles publish dates). */
export function formValuesToPayload(v: ArticleFormValues): ArticleWritePayload {
  const needsDate = v.status === "scheduled" || v.status === "published";
  let published_at: string | null = null;
  if (needsDate) {
    if (v.published_at) published_at = new Date(v.published_at).toISOString();
    else if (v.status === "published") published_at = new Date().toISOString();
  }
  return {
    title: v.title,
    subtitle: v.subtitle || "",
    excerpt: v.excerpt || "",
    content: v.content,
    category_id: v.category_id,
    status: v.status,
    published_at,
    image_caption: v.image_caption || "",
    featured_image_url: v.featured_image_url || "",
  };
}

/** ISO timestamp -> the value a <input type="datetime-local"> expects. */
export function isoToLocalInput(iso: string | null): string {
  if (!iso) return "";
  return iso.slice(0, 16); // "2027-08-09T18:00:00Z" -> "2027-08-09T18:00"
}
