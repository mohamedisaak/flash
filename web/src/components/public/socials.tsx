/** Small inline social icons (Facebook, X/Twitter, LinkedIn, Pinterest, Instagram). */
const ICONS: Record<string, string> = {
  facebook: "M13 3h4V0h-4a5 5 0 0 0-5 5v3H5v3h3v10h3V11h3l1-3h-4V5a2 2 0 0 1 2-2z",
  twitter: "M18 4a7 7 0 0 1-2 .6A3.5 3.5 0 0 0 17.5 3a7 7 0 0 1-2.2.9A3.5 3.5 0 0 0 9 6.8 10 10 0 0 1 2 3s-4 9 5 13a11 11 0 0 1-6 2c9 5 20 0 20-11.5 0-.3 0-.6-.1-.8A6.9 6.9 0 0 0 18 4z",
  linkedin: "M4 4a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM2 9h4v11H2zM9 9h4v1.6c.6-1 1.8-1.8 3.3-1.8 3 0 4 2 4 5v6h-4v-5c0-1.3-.5-2.2-1.7-2.2S12 13.6 12 15v5H9z",
  instagram: "M12 2c2.7 0 3 0 4.1.1 1 0 1.7.2 2.3.5.6.2 1 .5 1.5 1s.8.9 1 1.5c.3.6.4 1.3.5 2.3C21.5 8.9 21.5 9.3 21.5 12s0 3-.1 4.1c0 1-.2 1.7-.5 2.3-.2.6-.5 1-1 1.5s-.9.8-1.5 1c-.6.3-1.3.4-2.3.5-1.1.1-1.4.1-4.1.1s-3 0-4.1-.1c-1 0-1.7-.2-2.3-.5a4 4 0 0 1-1.5-1 4 4 0 0 1-1-1.5c-.3-.6-.4-1.3-.5-2.3C2.5 15 2.5 14.7 2.5 12s0-3 .1-4.1c0-1 .2-1.7.5-2.3.2-.6.5-1 1-1.5s.9-.8 1.5-1c.6-.3 1.3-.4 2.3-.5C9 2 9.3 2 12 2zm0 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0 2a3 3 0 1 1 0 6 3 3 0 0 1 0-6zm5-.5a1 1 0 1 1 0 2 1 1 0 0 1 0-2z",
};

export function SocialIcons({ className = "", size = 18 }: { className?: string; size?: number }) {
  const links = [
    ["facebook", "https://facebook.com"],
    ["twitter", "https://twitter.com"],
    ["linkedin", "https://linkedin.com"],
    ["instagram", "https://instagram.com"],
  ] as const;
  return (
    <div className={`flex gap-2 ${className}`}>
      {links.map(([name, url]) => (
        <a
          key={name}
          href={url}
          aria-label={name}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-8 w-8 items-center justify-center rounded bg-brand text-white hover:bg-brand-dark"
        >
          <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d={ICONS[name]} />
          </svg>
        </a>
      ))}
    </div>
  );
}
