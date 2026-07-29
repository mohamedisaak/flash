/**
 * The right-hand sidebar used on the home, category and article pages:
 * an advertisement slot, a tag cloud, and a Popular/Recent news widget.
 */
import Image from "next/image";
import Link from "next/link";
import { api } from "@/lib/api";
import { env } from "@/lib/env";
import { formatDate, mediaUrl } from "@/lib/utils";
import type { ArticleListItem } from "@/lib/types";
import { Ad } from "./ad";

function MiniArticle({ a }: { a: ArticleListItem }) {
  const img = mediaUrl(a.featured_image, env.backendOrigin);
  return (
    <Link href={`/articles/${a.slug}`} className="flex gap-3 py-3 group">
      <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded bg-gray-100">
        {img && <Image src={img} alt={a.title} fill sizes="96px" className="object-cover" />}
      </div>
      <div className="min-w-0">
        <span className="text-[11px] font-semibold uppercase text-accent">{a.category.name}</span>
        <h4 className="line-clamp-2 text-sm font-bold leading-snug group-hover:text-brand">
          {a.title}
        </h4>
        <p className="mt-0.5 text-xs text-[var(--muted)]">{formatDate(a.published_at)}</p>
      </div>
    </Link>
  );
}

export async function Sidebar() {
  const [tags, popular] = await Promise.all([api.listTags(), api.listPopular(5)]);

  return (
    <aside className="space-y-8">
      <Ad
        placement="sidebar"
        placeholderClassName="h-72 text-lg"
        imageClassName="w-full max-h-[28rem]"
      />

      {tags.length > 0 && (
        <div>
          <h3 className="section-title mb-4">Tags</h3>
          <div className="flex flex-wrap gap-2">
            {tags.map((t) => (
              <Link
                key={t.id}
                href={`/search?q=${encodeURIComponent(t.name)}`}
                className="rounded bg-gray-500/90 px-2.5 py-1 text-xs font-medium text-white hover:bg-brand"
              >
                {t.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="section-title mb-2">Popular &amp; Recent News</h3>
        <div className="divide-y divide-[var(--border)]">
          {popular.map((a) => (
            <MiniArticle key={a.id} a={a} />
          ))}
        </div>
      </div>
    </aside>
  );
}
