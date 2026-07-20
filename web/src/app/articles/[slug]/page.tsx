/**
 * Article page — the SEO-critical page.
 *
 * Three things make it rank:
 * 1. `generateMetadata` produces per-article <title>, description, Open Graph and
 *    Twitter tags from the article's own SEO fields.
 * 2. `<JsonLd>` embeds schema.org NewsArticle markup (fetched from the backend).
 * 3. ISR (`revalidate`) keeps pages fast and fresh.
 *
 * In Next 16 route `params` is a Promise you `await`. See
 * teaching/12-nextjs/05-images-and-metadata.md.
 */
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { api } from "@/lib/api";
import { env } from "@/lib/env";
import { formatDate, mediaUrl } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { JsonLd } from "@/components/json-ld";

export const revalidate = 300;

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await api.getArticle(slug);
  if (!article) return { title: "Not found" };

  const title = article.seo_title || article.title;
  const description = article.meta_description || article.excerpt;
  const image = mediaUrl(article.featured_image, env.backendOrigin) ?? undefined;

  return {
    title,
    description,
    alternates: { canonical: article.canonical_url || `${env.siteUrl}/articles/${article.slug}` },
    openGraph: {
      title,
      description,
      type: "article",
      publishedTime: article.published_at ?? undefined,
      authors: [article.author.full_name || article.author.username],
      images: image ? [image] : undefined,
    },
    twitter: { card: "summary_large_image", title, description, images: image ? [image] : undefined },
  };
}

export default async function ArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const article = await api.getArticle(slug);
  if (!article) notFound();

  const jsonLd = await api.getArticleJsonLd(slug);
  const img = mediaUrl(article.featured_image, env.backendOrigin);

  return (
    <article className="mx-auto max-w-3xl">
      {/* JSON-LD: newsArticle + breadcrumb come from the backend SEO endpoint. */}
      <JsonLd data={(jsonLd?.newsArticle as Record<string, unknown>) ?? null} />
      <JsonLd data={(jsonLd?.breadcrumb as Record<string, unknown>) ?? null} />

      <div className="mb-3">
        <Link href={`/${article.category.slug}`}>
          <Badge variant="brand">{article.category.name}</Badge>
        </Link>
        {article.is_breaking && <Badge variant="brand" className="ml-2">BREAKING</Badge>}
      </div>

      <h1 className="text-3xl md:text-4xl font-extrabold leading-tight">{article.title}</h1>
      {article.subtitle && <p className="mt-2 text-lg text-[var(--muted)]">{article.subtitle}</p>}

      <p className="mt-3 text-sm text-[var(--muted)]">
        By {article.author.full_name || article.author.username} · {formatDate(article.published_at)}
        {article.reading_time ? ` · ${article.reading_time} min read` : ""}
      </p>

      {img && (
        <figure className="mt-4">
          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-lg bg-gray-100">
            <Image src={img} alt={article.image_caption || article.title} fill priority sizes="(max-width: 768px) 100vw, 768px" className="object-cover" />
          </div>
          {article.image_caption && (
            <figcaption className="mt-1 text-xs text-[var(--muted)]">
              {article.image_caption}
              {article.source ? ` — ${article.source}` : ""}
            </figcaption>
          )}
        </figure>
      )}

      {/* Article body is trusted HTML produced by the editor (Tiptap). */}
      <div className="article-body mt-6 text-[1.05rem] leading-relaxed" dangerouslySetInnerHTML={{ __html: article.content }} />

      {article.tags.length > 0 && (
        <div className="mt-8 flex flex-wrap gap-2">
          {article.tags.map((t) => (
            <Badge key={t.id}>#{t.name}</Badge>
          ))}
        </div>
      )}
    </article>
  );
}
