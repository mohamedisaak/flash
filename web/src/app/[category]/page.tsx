/**
 * Category (section) page — matches the backend sitemap's `/{slug}` URLs.
 *
 * This is a root-level dynamic segment, so explicit routes (`/articles`,
 * `/search`) take precedence and only true section slugs (`/politics`) land here.
 * See teaching/12-nextjs/06-routing-and-params.md.
 */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { api } from "@/lib/api";
import { env } from "@/lib/env";
import { ArticleCard } from "@/components/article-card";

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
    <div>
      <header className="mb-6 border-b border-[var(--border)] pb-3">
        <h1 className="text-2xl font-extrabold">{category.name}</h1>
        {category.description && <p className="mt-1 text-[var(--muted)]">{category.description}</p>}
      </header>

      {articles.length === 0 ? (
        <p className="text-[var(--muted)]">No stories in this section yet.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((a) => (
            <ArticleCard key={a.id} article={a} />
          ))}
        </div>
      )}
    </div>
  );
}
