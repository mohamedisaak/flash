/** Public video gallery: a grid of video thumbnails with a play overlay. */
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { api } from "@/lib/api";
import { env } from "@/lib/env";
import { formatDate, mediaUrl } from "@/lib/utils";

export const revalidate = 300;
export const metadata: Metadata = { title: "Video Gallery" };

export default async function VideoGalleryPage() {
  const videos = await api.listVideos();

  return (
    <div>
      <h1 className="text-3xl font-extrabold">Video Gallery</h1>
      <nav className="mt-2 border-b border-[var(--border)] pb-3 text-sm text-[var(--muted)]">
        <Link href="/" className="hover:text-brand">Home</Link>
        <span className="mx-2">/</span>
        <span>Video Gallery</span>
      </nav>

      {videos.length === 0 ? (
        <p className="mt-8 text-[var(--muted)]">No videos published yet.</p>
      ) : (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {videos.map((v) => {
            const thumb = mediaUrl(v.thumbnail, env.backendOrigin);
            return (
              <figure key={v.id} className="group">
                <div className="relative aspect-video w-full overflow-hidden rounded bg-black">
                  {thumb && <Image src={thumb} alt={v.title} fill sizes="300px" className="object-cover opacity-90" />}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-black/50 text-2xl text-white">▶</span>
                  </div>
                </div>
                <figcaption className="mt-2 font-semibold leading-snug">{v.title}</figcaption>
                <p className="text-xs text-[var(--muted)]">{formatDate(v.published_at)}</p>
              </figure>
            );
          })}
        </div>
      )}
    </div>
  );
}
