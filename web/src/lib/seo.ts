/**
 * Shared SEO helpers: absolute-URL building and schema.org JSON-LD builders.
 *
 * The article/video JSON-LD is produced by the Django backend (see the `seo`
 * app) and embedded via `<JsonLd>`. Everything else that benefits from
 * structured data — the site-wide WebSite/Organization graph, breadcrumbs,
 * author profiles, FAQ pages — is built here on the frontend so pages stay
 * self-contained and need no extra backend round-trip.
 *
 * All builders return plain objects; `<JsonLd>` handles safe serialization.
 * See teaching/23-seo/02-structured-data.md.
 */
import { env } from "./env";
import type { AuthorMini, SiteSettings } from "./types";

/** Join a site-relative path onto the public site origin (no double slashes). */
export function absoluteUrl(path = "/"): string {
  const base = env.siteUrl.replace(/\/$/, "");
  return path.startsWith("http") ? path : `${base}${path.startsWith("/") ? "" : "/"}${path}`;
}

type JsonLd = Record<string, unknown>;

/**
 * WebSite node with a SearchAction — makes the site eligible for the Google
 * sitelinks search box and declares the canonical search endpoint.
 */
export function buildWebsiteJsonLd(name: string): JsonLd {
  const base = absoluteUrl("/");
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name,
    url: base,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${base}search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/** Publisher Organization node (logo powers the knowledge-panel / news byline). */
export function buildOrganizationJsonLd(settings: SiteSettings | null): JsonLd {
  const name = settings?.site_name || "Flash News";
  const org: JsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsMediaOrganization",
    name,
    url: absoluteUrl("/"),
  };
  const logo = settings?.logo
    ? settings.logo.startsWith("http")
      ? settings.logo
      : `${env.backendOrigin.replace(/\/$/, "")}${settings.logo}`
    : null;
  if (logo) org.logo = { "@type": "ImageObject", url: logo };
  return org;
}

/** BreadcrumbList from ordered [name, path] pairs (path is site-relative). */
export function buildBreadcrumbJsonLd(crumbs: Array<[string, string]>): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map(([name, path], i) => ({
      "@type": "ListItem",
      position: i + 1,
      name,
      item: absoluteUrl(path),
    })),
  };
}

/** ProfilePage + Person for an author page. */
export function buildAuthorJsonLd(author: AuthorMini, articleCount: number): JsonLd {
  const name = author.full_name || author.username;
  const image = author.avatar
    ? author.avatar.startsWith("http")
      ? author.avatar
      : `${env.backendOrigin.replace(/\/$/, "")}${author.avatar}`
    : undefined;
  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    dateModified: new Date().toISOString(),
    mainEntity: {
      "@type": "Person",
      name,
      url: absoluteUrl(`/authors/${author.id}`),
      ...(image ? { image } : {}),
      description: `Author at the newsroom — ${articleCount} published article${
        articleCount === 1 ? "" : "s"
      }.`,
    },
  };
}

/** FAQPage from question/answer pairs. */
export function buildFaqJsonLd(faqs: Array<{ question: string; answer: string }>): JsonLd | null {
  if (faqs.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };
}

/** CollectionPage for a section/list page. */
export function buildCollectionJsonLd(name: string, path: string, description?: string): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name,
    url: absoluteUrl(path),
    ...(description ? { description } : {}),
  };
}
