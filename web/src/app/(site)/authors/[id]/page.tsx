/**
 * Public author page: the author's profile card + their published articles.
 * Author details come from the first article (the API embeds an author card).
 */
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { api } from "@/lib/api";
import { env } from "@/lib/env";
import { formatDate, mediaUrl } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Sidebar } from "@/components/public/sidebar";
import { JsonLd } from "@/components/json-ld";
import { buildAuthorJsonLd, buildBreadcrumbJsonLd } from "@/lib/seo";

export const revalidate = 120;

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const { results } = await api.articlesByAuthor(Number(id));
  const name = results[0]?.author.full_name || results[0]?.author.username || "Author";
  const description = `Articles and reporting by ${name}.`;
  return {
    title: `${name} — Author`,
    description,
    alternates: { canonical: `${env.siteUrl}/authors/${id}` },
    openGraph: {
      title: `${name} — Author`,
      description,
      type: "profile",
      url: `${env.siteUrl}/authors/${id}`,
    },
    twitter: { card: "summary", title: `${name} — Author`, description },
  };
}

export default async function AuthorPage({ params }: PageProps) {
  const { id } = await params;
  const { results } = await api.articlesByAuthor(Number(id));
  if (results.length === 0) notFound();

  const author = results[0].author;
  const avatar = mediaUrl(author.avatar, env.backendOrigin);
  const authorName = author.full_name || author.username;

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <div>
        <JsonLd data={buildAuthorJsonLd(author, results.length)} />
        <JsonLd
          data={buildBreadcrumbJsonLd([
            ["Home", "/"],
            [authorName, `/authors/${author.id}`],
          ])}
        />
        {/* Breadcrumb (crawlable) */}
        <nav className="mb-3 text-sm text-[var(--muted)]" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-brand">
            Home
          </Link>
          <span className="mx-2">/</span>
          <span>{authorName}</span>
        </nav>
        <div className="mb-6 flex items-center gap-4 border-b border-[var(--border)] pb-5">
          <div className="relative h-20 w-20 overflow-hidden rounded-full bg-gray-200">
            {avatar && (
              <Image
                src={avatar}
                alt={author.full_name || author.username}
                fill
                sizes="80px"
                className="object-cover"
              />
            )}
          </div>
          <div>
            <h1 className="text-2xl font-extrabold">{author.full_name || author.username}</h1>
            <p className="text-sm text-[var(--muted)]">
              {results.length} article{results.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {results.map((a) => {
            const img = mediaUrl(a.featured_image, env.backendOrigin);
            return (
              <Link key={a.id} href={`/articles/${a.slug}`} className="group block">
                <div className="relative aspect-[16/10] w-full overflow-hidden rounded bg-gray-100">
                  {img && (
                    <Image
                      src={img}
                      alt={a.title}
                      fill
                      sizes="360px"
                      className="object-cover transition group-hover:scale-105"
                    />
                  )}
                  <div className="absolute left-3 top-3">
                    <Badge variant="accent">{a.category.name}</Badge>
                  </div>
                </div>
                <h3 className="mt-2 font-bold leading-snug group-hover:text-brand">{a.title}</h3>
                <p className="mt-1 text-xs text-[var(--muted)]">{formatDate(a.published_at)}</p>
              </Link>
            );
          })}
        </div>
      </div>
      <Sidebar />
    </div>
  );
}
