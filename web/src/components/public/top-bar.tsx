/**
 * The thin utility bar above the header: today's date + contact email on the
 * left, quick links + language on the right (NewsPortal style).
 */
import Link from "next/link";

export function TopBar() {
  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "2-digit",
  });

  return (
    <div className="bg-[var(--topbar-bg)] text-sm text-[var(--foreground)]">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-1 px-4 py-2">
        <span className="flex items-center gap-1.5">
          <span aria-hidden>🗓</span> Today: {today}
        </span>
        <span className="flex items-center gap-1.5">
          <span aria-hidden>✉️</span> contact@flashnews.dev
        </span>
        <nav className="ml-auto flex items-center gap-4">
          <Link href="/about" className="hover:text-brand">FAQ</Link>
          <span className="text-[var(--border)]">|</span>
          <Link href="/about" className="hover:text-brand">About</Link>
          <span className="text-[var(--border)]">|</span>
          <Link href="/about" className="hover:text-brand">Contact Us</Link>
          <span className="text-[var(--border)]">|</span>
          <Link href="/dashboard/login" className="hover:text-brand">Login</Link>
          <select
            aria-label="Language"
            className="ml-1 rounded border border-[var(--border)] bg-white px-1.5 py-0.5 text-xs"
            defaultValue="en"
          >
            <option value="en">English</option>
          </select>
        </nav>
      </div>
    </div>
  );
}
