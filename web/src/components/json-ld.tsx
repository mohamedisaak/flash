/**
 * Embeds a schema.org JSON-LD document into the page.
 *
 * Search engines read this `<script type="application/ld+json">` block to
 * understand the page (headline, author, date...). We get the JSON from the
 * backend's SEO endpoints.
 *
 * Security: the JSON contains values like article titles and author names —
 * some of which originate from aggregated *external* feeds — so it must be
 * treated as untrusted. `JSON.stringify` does **not** escape `<`, so a value
 * containing `</script>` would break out of the script tag (XSS). We escape the
 * HTML-significant characters (`<`, `>`, `&`) and the JS line separators
 * (U+2028/U+2029) to their `\uXXXX` forms before injecting. The result is still
 * valid JSON-LD. See teaching/23-seo/02-structured-data.md.
 */
// Pattern built from an ASCII string so no literal separator chars appear here.
const UNSAFE_JSONLD = new RegExp("[<>&\\u2028\\u2029]", "g");

function safeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(
    UNSAFE_JSONLD,
    (c) => "\\u" + c.charCodeAt(0).toString(16).padStart(4, "0"),
  );
}

export function JsonLd({ data }: { data: Record<string, unknown> | null }) {
  if (!data) return null;
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(data) }} />
  );
}
