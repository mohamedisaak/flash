/**
 * Category (section) page — matches the sitemap's `/{slug}` URLs.
 * Big lead + list in the main column, with the shared sidebar.
 * See teaching/12-nextjs/06-routing-and-params.md.
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

export const revalidate = 120;

type PageProps = { params: Promise<{ category: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category: slug } = await params;
  const category = await api.getCategory(slug);
  if (!category) return { title: "Section not found" };
  return {
    title: category.seo_title || category.name,
    description: category.meta_description || category.description,
    alternates: { canonical: `${env.siteUrl}/${category.slug}` },
  };
}

export default async function CategoryPage({ params }: PageProps) {
  const { category: slug } = await params;
  const category = await api.getCategory(slug);
  if (!category) notFound();

  const { results: articles } = await api.articlesInCategory(slug);

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <div>
        <header className="mb-5">
          <h1 className="text-3xl font-extrabold">{category.name}</h1>
          <nav className="mt-2 border-b border-[var(--border)] pb-3 text-sm text-[var(--muted)]">
            <Link href="/" className="hover:text-brand">Home</Link>
            <span className="mx-2">/</span>
            <span>{category.name}</span>
          </nav>
        </header>

        {articles.length === 0 ? (
          <p className="text-[var(--muted)]">No stories in this section yet.</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            {articles.map((a) => {
              const img = mediaUrl(a.featured_image, env.backendOrigin);
              return (
                <Link key={a.id} href={`/articles/${a.slug}`} className="group block">
                  <div className="relative aspect-[16/10] w-full overflow-hidden rounded bg-gray-100">
                    {img && <Image src={img} alt={a.title} fill sizes="(max-width:768px) 100vw, 360px" className="object-cover transition group-hover:scale-105" />}
                    <div className="absolute left-3 top-3"><Badge variant="accent">{a.category.name}</Badge></div>
                  </div>
                  <h3 className="mt-2 text-lg font-bold leading-snug group-hover:text-brand">{a.title}</h3>
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    {a.author.full_name || a.author.username} · {formatDate(a.published_at)}
                  </p>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <Sidebar />
    </div>
  );
}
