/**
 * A category section on the home page: a heading + "See All News", one large
 * lead article on the left, and a list of smaller headlines on the right.
 */
import Image from "next/image";
import Link from "next/link";
import { env } from "@/lib/env";
import { formatDate, mediaUrl } from "@/lib/utils";
import type { ArticleListItem, Category } from "@/lib/types";
import { Badge } from "@/components/ui/badge";

function SmallItem({ a }: { a: ArticleListItem }) {
  const img = mediaUrl(a.featured_image, env.backendOrigin);
  return (
    <Link href={`/articles/${a.slug}`} className="flex gap-3 py-3 group">
      <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded bg-gray-100">
        {img && <Image src={img} alt={a.title} fill sizes="112px" className="object-cover" />}
      </div>
      <div className="min-w-0">
        <Badge variant="accent">{a.category.name}</Badge>
        <h4 className="mt-1 line-clamp-2 font-bold leading-snug group-hover:text-brand">
          {a.title}
        </h4>
        <p className="mt-1 text-xs text-[var(--muted)]">
          {a.author.full_name || a.author.username} · {formatDate(a.published_at)}
        </p>
      </div>
    </Link>
  );
}

export function SectionBlock({
  category,
  articles,
}: {
  category: Category;
  articles: ArticleListItem[];
}) {
  if (articles.length === 0) return null;
  const [lead, ...rest] = articles;
  const leadImg = mediaUrl(lead.featured_image, env.backendOrigin);

  return (
    <section className="mb-10">
      <div className="mb-4 flex items-center justify-between border-b border-[var(--border)] pb-1">
        <h2 className="text-2xl font-extrabold">{category.name}</h2>
        <Link
          href={`/${category.slug}`}
          className="rounded bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-dark"
        >
          See All News
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Lead article */}
        <Link href={`/articles/${lead.slug}`} className="group block">
          <div className="relative aspect-[16/10] w-full overflow-hidden rounded bg-gray-100">
            {leadImg && (
              <Image
                src={leadImg}
                alt={lead.title}
                fill
                sizes="(max-width:768px) 100vw, 500px"
                className="object-cover transition group-hover:scale-105"
              />
            )}
            <div className="absolute left-3 top-3">
              <Badge variant="accent">{lead.category.name}</Badge>
            </div>
          </div>
          <h3 className="mt-3 text-xl font-extrabold leading-snug group-hover:text-brand">
            {lead.title}
          </h3>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {lead.author.full_name || lead.author.username} · {formatDate(lead.published_at)}
          </p>
          {lead.excerpt && (
            <p className="mt-2 line-clamp-3 text-sm text-[var(--muted)]">{lead.excerpt}</p>
          )}
        </Link>

        {/* Smaller items */}
        <div className="divide-y divide-[var(--border)]">
          {rest.slice(0, 4).map((a) => (
            <SmallItem key={a.id} a={a} />
          ))}
        </div>
      </div>
    </section>
  );
}
