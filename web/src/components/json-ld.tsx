/**
 * Embeds a schema.org JSON-LD document into the page.
 *
 * Search engines read this `<script type="application/ld+json">` block to
 * understand the page (headline, author, date...). We get the JSON from the
 * backend's SEO endpoints, so the schema lives in one place. Using
 * `dangerouslySetInnerHTML` is the standard, safe way to inject JSON-LD (the
 * content is our own structured data, not user input).
 * See teaching/23-seo/02-structured-data.md and
 * teaching/12-nextjs/05-images-and-metadata.md.
 */
export function JsonLd({ data }: { data: Record<string, unknown> | null }) {
  if (!data) return null;
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
