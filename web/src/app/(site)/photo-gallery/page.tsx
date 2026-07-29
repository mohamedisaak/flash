/** Public photo gallery: a grid of images across all published galleries. */
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { api } from "@/lib/api";
import { env } from "@/lib/env";
import { formatDate, mediaUrl } from "@/lib/utils";

export const revalidate = 300;
export const metadata: Metadata = {
  title: "Photo Gallery",
  description: "Browse the latest news photo galleries and picture stories.",
  alternates: { canonical: `${env.siteUrl}/photo-gallery` },
  openGraph: { title: "Photo Gallery", type: "website", url: `${env.siteUrl}/photo-gallery` },
};

export default async function PhotoGalleryPage() {
  const galleries = await api.listGalleries();
  const images = galleries.flatMap((g) =>
    g.images.map((img) => ({ ...img, gallery: g.title, date: g.published_at ?? g.created_at })),
  );

  return (
    <div>
      <h1 className="text-3xl font-extrabold">Photo Gallery</h1>
      <nav className="mt-2 border-b border-[var(--border)] pb-3 text-sm text-[var(--muted)]">
        <Link href="/" className="hover:text-brand">
          Home
        </Link>
        <span className="mx-2">/</span>
        <span>Photo Gallery</span>
      </nav>

      {images.length === 0 ? (
        <p className="mt-8 text-[var(--muted)]">No photos published yet.</p>
      ) : (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {images.map((img) => {
            const src = mediaUrl(img.image, env.backendOrigin);
            return (
              <figure key={img.id} className="group">
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded bg-gray-100">
                  {src && (
                    <Image
                      src={src}
                      alt={img.caption || img.gallery}
                      fill
                      sizes="300px"
                      className="object-cover transition group-hover:scale-105"
                    />
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition group-hover:bg-black/30 group-hover:opacity-100">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-white text-2xl text-white">
                      +
                    </span>
                  </div>
                </div>
                <figcaption className="mt-2 font-semibold">{img.caption || img.gallery}</figcaption>
                <p className="text-xs text-[var(--muted)]">{formatDate(img.date)}</p>
              </figure>
            );
          })}
        </div>
      )}
    </div>
  );
}
