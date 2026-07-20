/** Social share buttons for an article (server-rendered anchor links). */
const SHARE = [
  { name: "Facebook", color: "#3b5998", url: (u: string) => `https://www.facebook.com/sharer/sharer.php?u=${u}` },
  { name: "Twitter", color: "#1da1f2", url: (u: string, t: string) => `https://twitter.com/intent/tweet?url=${u}&text=${t}` },
  { name: "LinkedIn", color: "#0077b5", url: (u: string) => `https://www.linkedin.com/sharing/share-offsite/?url=${u}` },
  { name: "WhatsApp", color: "#25d366", url: (u: string, t: string) => `https://wa.me/?text=${t}%20${u}` },
];

export function ShareButtons({ url, title }: { url: string; title: string }) {
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(title);
  return (
    <div className="flex flex-wrap gap-2">
      {SHARE.map((s) => (
        <a
          key={s.name}
          href={s.url(u, t)}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded px-4 py-2 text-sm font-semibold text-white"
          style={{ backgroundColor: s.color }}
        >
          {s.name}
        </a>
      ))}
    </div>
  );
}
