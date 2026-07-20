/**
 * Home page (NewsPortal layout).
 *
 * ISR (revalidate 60s). Composes: a hero (lead + featured), an ad banner, the
 * search bar, then per-category section blocks in the main column with a sticky
 * sidebar (ads, tags, popular). See
 * teaching/12-nextjs/04-rendering-strategies.md.
 */
import Image from "next/image";
import Link from "next/link";
import { api } from "@/lib/api";
import { env } from "@/lib/env";
import { formatDate, mediaUrl } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { SectionBlock } from "@/components/public/section-block";
import { Sidebar } from "@/components/public/sidebar";
import { HomeSearch } from "@/components/public/home-search";
import type { ArticleListItem } from "@/lib/types";

export const revalidate = 60;

function HeroFeatured({ a }: { a: ArticleListItem }) {
  const img = mediaUrl(a.featured_image, env.backendOrigin);
  return (
    <Link href={`/articles/${a.slug}`} className="group relative block overflow-hidden rounded">
      <div className="relative aspect-[16/9] w-full bg-gray-200">
        {img && <Image src={img} alt={a.title} fill sizes="400px" className="object-cover transition group-hover:scale-105" />}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
      </div>
      <div className="absolute bottom-0 p-3 text-white">
        <Badge variant="accent">{a.category.name}</Badge>
        <h3 className="mt-1 line-clamp-2 text-lg font-bold leading-snug">{a.title}</h3>
        <p className="mt-1 text-xs opacity-90">
          {a.author.full_name || a.author.username} · {formatDate(a.published_at)}
        </p>
      </div>
    </Link>
  );
}

export default async function HomePage() {
  const [{ results: latest }, categories] = await Promise.all([
    api.listArticles({ page_size: 30, ordering: "-published_at" }),
    api.listCategories(),
  ]);

  if (latest.length === 0) {
    return (
      <div className="py-16 text-center text-[var(--muted)]">
        <h1 className="text-xl font-semibold">No stories yet</h1>
        <p className="mt-2 text-sm">Publish an article, then refresh. (Backend on <code>:8000</code>?)</p>
      </div>
    );
  }

  const [lead, ...rest] = latest;
  const leadImg = mediaUrl(lead.featured_image, env.backendOrigin);
  const topCats = categories.filter((c) => c.parent === null).sort((a, b) => a.order - b.order);

  return (
    <div>
      {/* Hero: big lead + two featured */}
      <section className="grid gap-5 lg:grid-cols-[2fr_1fr]">
        <Link href={`/articles/${lead.slug}`} className="group relative block overflow-hidden rounded">
          <div className="relative aspect-[16/10] w-full bg-gray-200">
            {leadImg && <Image src={leadImg} alt={lead.title} fill priority sizes="(max-width:1024px) 100vw, 760px" className="object-cover transition group-hover:scale-105" />}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
          </div>
          <div className="absolute bottom-0 p-5 text-white">
            <Badge variant="accent">{lead.category.name}</Badge>
            <h2 className="mt-2 text-2xl font-extrabold leading-tight md:text-3xl">{lead.title}</h2>
            <p className="mt-1 text-sm opacity-90">
              {lead.author.full_name || lead.author.username} · {formatDate(lead.published_at)}
            </p>
          </div>
        </Link>
        <div className="grid gap-5">
          {rest.slice(0, 2).map((a) => (
            <HeroFeatured key={a.id} a={a} />
          ))}
        </div>
      </section>

      {/* Ad banner */}
      <div className="my-6 flex h-28 items-center justify-center bg-gray-200 text-xl font-semibold text-gray-400">
        Advertisement
      </div>

      {/* Search */}
      <HomeSearch categories={categories} />

      {/* Main + sidebar */}
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
        <div>
          {topCats.map((cat) => {
            const items = latest.filter((a) => a.category.slug === cat.slug);
            return <SectionBlock key={cat.id} category={cat} articles={items} />;
          })}
        </div>
        <Sidebar />
      </div>
    </div>
  );
}
