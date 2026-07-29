/** Small formatting/parsing helpers shared across screens. */

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
 * Turn article HTML into plain-text paragraph blocks for rendering with <Text>.
 * We don't run a full HTML engine on device — we strip tags, decode a few common
 * entities, and split on block boundaries. Good enough for news copy.
 */
export function htmlToParagraphs(html: string): string[] {
  if (!html) return [];
  const withBreaks = html
    .replace(/<\/(p|div|h[1-6]|li|blockquote)>/gi, "\n\n")
    .replace(/<br\s*\/?>(?=)/gi, "\n");
  const text = withBreaks
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&rsquo;/g, "’")
    .replace(/&ldquo;/g, "“")
    .replace(/&rdquo;/g, "”");
  return text
    .split(/\n\s*\n/)
    .map((p) => p.replace(/[ \t]+/g, " ").trim())
    .filter(Boolean);
}
