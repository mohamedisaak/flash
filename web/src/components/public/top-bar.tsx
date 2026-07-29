/**
 * The thin utility bar above the header: today's date + contact email on the
 * left, quick links + language on the right (NewsPortal style). The email and
 * date come from CMS site settings and honour the "Show date"/"Show email"
 * toggles in the admin panel.
 */
import Link from "next/link";
import { api } from "@/lib/api";

export async function TopBar() {
  const settings = await api.getSiteSettings();
  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "2-digit",
  });
  const showDate = settings?.date_status ?? true;
  const showEmail = settings?.email_status ?? true;
  const email = settings?.contact_email || "contact@flashnews.dev";

  return (
    <div className="bg-[var(--topbar-bg)] text-sm text-[var(--foreground)]">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-1 px-4 py-2">
        {showDate && (
          <span className="flex items-center gap-1.5">
            <span aria-hidden>🗓</span> Today: {today}
          </span>
        )}
        {showEmail && (
          <span className="flex items-center gap-1.5">
            <span aria-hidden>✉️</span> {email}
          </span>
        )}
        <nav className="ml-auto flex items-center gap-4">
          <Link href="/faq" className="hover:text-brand">
            FAQ
          </Link>
          <span className="text-[var(--border)]">|</span>
          <Link href="/pages/about" className="hover:text-brand">
            About
          </Link>
          <span className="text-[var(--border)]">|</span>
          <Link href="/pages/contact" className="hover:text-brand">
            Contact Us
          </Link>
          <span className="text-[var(--border)]">|</span>
          <Link href="/dashboard/login" className="hover:text-brand">
            Login
          </Link>
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
