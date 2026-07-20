/**
 * Home page.
 *
 * A Server Component that fetches the latest published articles and renders them.
 * `export const revalidate = 60` opts the page into **ISR**: Next serves a cached
 * static page and rebuilds it at most once every 60s — fast like static, fresh
 * like dynamic. See teaching/12-nextjs/04-rendering-strategies.md.
 */
import { api } from "@/lib/api";
import { ArticleCard } from "@/components/article-card";

export const revalidate = 60;

export default async function HomePage() {
  const { results: articles } = await api.listArticles({ page_size: 13, ordering: "-published_at" });

  if (articles.length === 0) {
    return (
      <div className="py-16 text-center text-[var(--muted)]">
        <h1 className="text-xl font-semibold">No stories yet</h1>
        <p className="mt-2 text-sm">
          Publish an article in the Django admin, then refresh. (Is the backend running on{" "}
          <code>:8000</code>?)
        </p>
      </div>
    );
  }

  const [lead, ...rest] = articles;

  return (
    <div className="space-y-8">
      <section className="grid gap-6 md:grid-cols-2">
        <ArticleCard article={lead} priority />
        <div className="grid gap-4">
          {rest.slice(0, 3).map((a) => (
            <ArticleCard key={a.id} article={a} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-bold border-b border-[var(--border)] pb-1">More stories</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {rest.slice(3).map((a) => (
            <ArticleCard key={a.id} article={a} />
          ))}
        </div>
      </section>
    </div>
  );
}
