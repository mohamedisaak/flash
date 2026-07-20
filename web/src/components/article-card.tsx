/**
 * A reusable article preview card used in feeds and lists.
 *
 * Takes an `ArticleListItem` as a prop and renders a link to the full article.
 * `next/image` optimizes the thumbnail (resizing, lazy-loading). See
 * teaching/13-react/03-props-and-composition.md.
 */
import Image from "next/image";
import Link from "next/link";
import { env } from "@/lib/env";
import { cn, formatDate, mediaUrl } from "@/lib/utils";
import type { ArticleListItem } from "@/lib/types";
import { Badge } from "./ui/badge";

export function ArticleCard({ article, priority = false }: { article: ArticleListItem; priority?: boolean }) {
  const img = mediaUrl(article.featured_image, env.backendOrigin);

  return (
    <article className="group">
      <Link href={`/articles/${article.slug}`} className="block">
        <div className={cn("relative aspect-[16/9] w-full overflow-hidden rounded-lg bg-gray-100")}>
          {img ? (
            <Image
              src={img}
              alt={article.title}
              fill
              priority={priority}
              sizes="(max-width: 768px) 100vw, 400px"
              className="object-cover transition-transform group-hover:scale-105"
            />
          ) : null}
          {article.is_breaking && (
            <Badge variant="brand" className="absolute left-2 top-2">
              BREAKING
            </Badge>
          )}
        </div>
        <div className="mt-2">
          <span className="text-xs font-semibold text-brand uppercase">{article.category.name}</span>
          <h3 className="mt-0.5 text-lg font-bold leading-snug group-hover:underline">{article.title}</h3>
          {article.excerpt && <p className="mt-1 text-sm text-[var(--muted)] line-clamp-2">{article.excerpt}</p>}
          <p className="mt-1 text-xs text-[var(--muted)]">
            {article.author.full_name || article.author.username} · {formatDate(article.published_at)}
            {article.reading_time ? ` · ${article.reading_time} min read` : ""}
          </p>
        </div>
      </Link>
    </article>
  );
}
