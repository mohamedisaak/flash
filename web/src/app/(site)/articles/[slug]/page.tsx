/**
 * Article page (NewsPortal layout) — the SEO-critical page.
 *
 * - `generateMetadata` → per-article title/description/OG/Twitter.
 * - `<JsonLd>` → schema.org NewsArticle + Breadcrumb from the backend.
 * - Layout: breadcrumb, hero image, meta (author/category/date/views), body,
 *   tags, share buttons, related news; plus the shared sidebar.
 * See teaching/12-nextjs/05-images-and-metadata.md.
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
import { Sidebar } from "@/components/public/sidebar";
import { ShareButtons } from "@/components/public/share-buttons";

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
      title, description, type: "article",
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

  const [jsonLd, related] = await Promise.all([
    api.getArticleJsonLd(slug),
    api.articlesInCategory(article.category.slug),
  ]);
  const img = mediaUrl(article.featured_image, env.backendOrigin);
  const relatedItems = related.results.filter((a) => a.slug !== slug).slice(0, 2);

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <article>
        <JsonLd data={(jsonLd?.newsArticle as Record<string, unknown>) ?? null} />
        <JsonLd data={(jsonLd?.breadcrumb as Record<string, unknown>) ?? null} />

        <h1 className="text-3xl font-extrabold leading-tight md:text-4xl">{article.title}</h1>

        {/* Breadcrumb */}
        <nav className="mt-3 border-b border-[var(--border)] pb-3 text-sm text-[var(--muted)]">
          <Link href="/" className="hover:text-brand">Home</Link>
          <span className="mx-2">/</span>
          <Link href={`/${article.category.slug}`} className="hover:text-brand">{article.category.name}</Link>
          <span className="mx-2">/</span>
          <span>{article.title}</span>
        </nav>

        {img && (
          <div className="relative mt-4 aspect-[16/9] w-full overflow-hidden rounded bg-gray-100">
            <Image src={img} alt={article.image_caption || article.title} fill priority sizes="(max-width:1024px) 100vw, 760px" className="object-cover" />
          </div>
        )}

        {/* Meta */}
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1 border-b border-[var(--border)] pb-3 text-sm text-[var(--muted)]">
          <Link href={`/authors/${article.author.id}`} className="flex items-center gap-1 hover:text-brand">
            <span aria-hidden>👤</span> {article.author.full_name || article.author.username}
          </Link>
          <Link href={`/${article.category.slug}`} className="flex items-center gap-1 hover:text-brand">
            <span aria-hidden>🗂</span> {article.category.name}
          </Link>
          <span className="flex items-center gap-1"><span aria-hidden>🕒</span> {formatDate(article.published_at)}</span>
          <span className="flex items-center gap-1"><span aria-hidden>👁</span> {article.views}</span>
        </div>

        {article.subtitle && <p className="mt-4 text-lg font-medium text-[var(--muted)]">{article.subtitle}</p>}

        <div className="article-body mt-4 text-[1.05rem] leading-relaxed" dangerouslySetInnerHTML={{ __html: article.content }} />

        {article.tags.length > 0 && (
          <div className="mt-8">
            <h3 className="mb-2 text-lg font-bold">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {article.tags.map((t) => (
                <Link key={t.id} href={`/search?q=${encodeURIComponent(t.name)}`} className="rounded bg-gray-500/90 px-2.5 py-1 text-xs font-medium text-white hover:bg-brand">
                  {t.name}
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8">
          <h3 className="mb-2 text-lg font-bold">Share</h3>
          <ShareButtons url={`${env.siteUrl}/articles/${article.slug}`} title={article.title} />
        </div>

        {relatedItems.length > 0 && (
          <div className="mt-10">
            <h3 className="section-title mb-4">Related News</h3>
            <div className="grid gap-6 sm:grid-cols-2">
              {relatedItems.map((a) => {
                const rimg = mediaUrl(a.featured_image, env.backendOrigin);
                return (
                  <Link key={a.id} href={`/articles/${a.slug}`} className="group block">
                    <div className="relative aspect-[16/9] w-full overflow-hidden rounded bg-gray-100">
                      {rimg && <Image src={rimg} alt={a.title} fill sizes="360px" className="object-cover" />}
                    </div>
                    <Badge variant="accent" className="mt-2">{a.category.name}</Badge>
                    <h4 className="mt-1 font-bold leading-snug group-hover:text-brand">{a.title}</h4>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      {a.author.full_name || a.author.username} · {formatDate(a.published_at)}
                    </p>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </article>

      <Sidebar />
    </div>
  );
}
