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
import { Ad } from "@/components/public/ad";
import { JsonLd } from "@/components/json-ld";
import { buildOrganizationJsonLd, buildWebsiteJsonLd } from "@/lib/seo";
import type { Metadata } from "next";
import type { ArticleListItem } from "@/lib/types";

// ISR: serve the homepage from a cached render (fast, and resilient to a slow
// backend) and refresh it at most every 60s. Publishing/editing/deleting an
// article also purges it on-demand via /api/revalidate (see apps/articles/
// signals.py), so new posts still appear immediately — without hammering the
// API on every single visit the way `force-dynamic` did.
export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const s = await api.getSiteSettings();
  const name = s?.site_name || "Flash News";
  const description =
    s?.about_us || "Breaking news, politics, business, sport and more — updated around the clock.";
  return {
    title: { absolute: name }, // home uses the bare site name, not the "%s — " template
    description,
    alternates: { canonical: "/" },
    openGraph: { title: name, description, url: "/", type: "website" },
  };
}

function HeroFeatured({ a }: { a: ArticleListItem }) {
  const img = mediaUrl(a.featured_image, env.backendOrigin);
  return (
    <Link href={`/articles/${a.slug}`} className="group relative block overflow-hidden rounded">
      <div className="relative aspect-[16/9] w-full bg-gray-200">
        {img && (
          <Image
            src={img}
            alt={a.title}
            fill
            sizes="400px"
            className="object-cover transition group-hover:scale-105"
          />
        )}
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
    api.listArticles({ page_size: 8, ordering: "-published_at" }),
    api.listCategories(),
  ]);

  if (latest.length === 0) {
    return (
      <div className="py-16 text-center text-[var(--muted)]">
        <h1 className="text-xl font-semibold">No stories yet</h1>
        <p className="mt-2 text-sm">
          Publish an article, then refresh. (Backend on <code>:8000</code>?)
        </p>
      </div>
    );
  }

  const [lead, ...rest] = latest;
  const leadImg = mediaUrl(lead.featured_image, env.backendOrigin);
  const topCats = categories.filter((c) => c.parent === null).sort((a, b) => a.order - b.order);

  // Fetch each category's own recent stories (in the admin's `order`) so every
  // section renders in sequence — a smaller category isn't starved out by a
  // shared "latest" pool that busier sections would dominate. Empty categories
  // render nothing (SectionBlock returns null).
  const [sections, settings] = await Promise.all([
    Promise.all(
      topCats.map(async (cat) => ({
        cat,
        articles: (
          await api.listArticles({ category: cat.slug, page_size: 5, ordering: "-published_at" })
        ).results,
      })),
    ),
    api.getSiteSettings(),
  ]);
  const siteName = settings?.site_name || "Flash News";

  return (
    <div>
      {/* Site-wide structured data: WebSite (with sitelinks SearchAction) +
          publisher Organization. Emitted once, on the home page. */}
      <JsonLd data={buildWebsiteJsonLd(siteName)} />
      <JsonLd data={buildOrganizationJsonLd(settings)} />
      {/* Hero: big lead + two featured */}
      <section className="grid gap-5 lg:grid-cols-[2fr_1fr]">
        <Link
          href={`/articles/${lead.slug}`}
          className="group relative block overflow-hidden rounded"
        >
          <div className="relative aspect-[16/10] w-full bg-gray-200">
            {leadImg && (
              <Image
                src={leadImg}
                alt={lead.title}
                fill
                priority
                sizes="(max-width:1024px) 100vw, 760px"
                className="object-cover transition group-hover:scale-105"
              />
            )}
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

      {/* In-content ad banner (between the hero and the sections) */}
      <Ad
        placement="in_content"
        className="my-6"
        height="h-32"
        placeholderClassName="h-28 text-xl"
      />

      {/* Search */}
      <HomeSearch categories={categories} />

      {/* Main + sidebar */}
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
        <div>
          {sections.map(({ cat, articles }) => (
            <SectionBlock key={cat.id} category={cat} articles={articles} />
          ))}
        </div>
        <Sidebar />
      </div>
    </div>
  );
}
