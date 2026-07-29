/**
 * Editable static pages (About, Contact, Terms, Privacy, Disclaimer).
 *
 * One dynamic route renders any `StaticPage` from the CMS, keyed by its slug in
 * the URL (`/pages/about`, `/pages/contact`, …). Editors change the title/body
 * in the dashboard's "Pages" section and it updates here (ISR, 5-min revalidate).
 *
 * See teaching/12-nextjs/06-routing-and-params.md.
 */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { api } from "@/lib/api";
import { env } from "@/lib/env";

// The keys we expose as pages (matches StaticPage.Key on the backend).
const KEYS = ["about", "contact", "terms", "privacy", "disclaimer"] as const;

export function generateStaticParams() {
  return KEYS.map((key) => ({ key }));
}

/** First ~160 chars of plain text, for a meta description. */
function summarize(content: string): string {
  const text = content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return text.length > 160 ? `${text.slice(0, 157)}…` : text;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ key: string }>;
}): Promise<Metadata> {
  const { key } = await params;
  const page = await api.getStaticPage(key);
  if (!page) return { title: "Page", robots: { index: false, follow: true } };
  const description = summarize(page.content) || page.title;
  return {
    title: page.title,
    description,
    alternates: { canonical: `${env.siteUrl}/pages/${key}` },
    openGraph: { title: page.title, description, type: "article", url: `${env.siteUrl}/pages/${key}` },
  };
}

/** Render admin content as HTML if it contains markup, else as text paragraphs. */
function PageBody({ content }: { content: string }) {
  const looksHtml = /<[a-z][\s\S]*>/i.test(content);
  const cls = "article-body mt-4 text-[1.05rem] leading-relaxed text-[var(--foreground)]";
  if (looksHtml) return <div className={cls} dangerouslySetInnerHTML={{ __html: content }} />;
  return (
    <div className={cls}>
      {content.split(/\n\n+/).map((para, i) => (
        <p key={i}>{para}</p>
      ))}
    </div>
  );
}

export default async function StaticPageView({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const page = await api.getStaticPage(key);
  if (!page) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-3xl font-extrabold">{page.title}</h1>
      <PageBody content={page.content} />
    </div>
  );
}
