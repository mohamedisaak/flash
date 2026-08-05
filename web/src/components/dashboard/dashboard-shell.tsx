"use client";

/**
 * Full-screen dashboard chrome (NewsPortal "Admin Panel" / "Author Panel"
 * style): a white left sidebar with icon nav, a purple top bar with a
 * "Front End" link + user menu, and a light-gray content area.
 *
 * Auth bootstrap: on mount, load /auth/me; redirect anonymous users to login.
 * The panel title and nav adapt to the user's role. See
 * teaching/12-nextjs/07-dashboard-and-forms.md.
 */
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { authApi, AuthError } from "@/lib/auth-api";
import { getAccessToken, getStoredUser, useAuthStore } from "@/lib/auth-store";
import { canPublish } from "@/lib/dashboard-types";
import { env } from "@/lib/env";

type NavLink = { href: string; label: string; icon?: string };
type NavGroup = { label: string; icon: string; children: NavLink[] };
type NavEntry = NavLink | NavGroup;

const isGroup = (e: NavEntry): e is NavGroup => "children" in e;

function NavLinkItem({ link, pathname }: { link: NavLink; pathname: string }) {
  const active = pathname === link.href;
  return (
    <Link
      href={link.href}
      className={`mb-1 flex items-center gap-3 rounded-md px-4 py-2.5 text-sm font-medium transition ${
        active ? "bg-brand/10 text-brand" : "text-gray-600 hover:bg-gray-50"
      }`}
    >
      {link.icon && <span aria-hidden>{link.icon}</span>} {link.label}
    </Link>
  );
}

function NavGroupItem({ group, pathname }: { group: NavGroup; pathname: string }) {
  const childActive = group.children.some((c) => pathname === c.href);
  const [open, setOpen] = useState(childActive);
  return (
    <div className="mb-1">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 rounded-md px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
      >
        <span aria-hidden>{group.icon}</span> {group.label}
        <span className="ml-auto text-xs">{open ? "▾" : "▸"}</span>
      </button>
      {open && (
        <div className="ml-4 border-l border-[var(--border)] pl-2">
          {group.children.map((c) => (
            <Link
              key={c.href}
              href={c.href}
              className={`block rounded-md px-4 py-2 text-sm transition ${
                pathname === c.href ? "text-brand font-medium" : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              {c.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// Full admin navigation (editors/admins).
const ADMIN_NAV: NavEntry[] = [
  { href: "/dashboard", label: "Dashboard", icon: "🏠" },
  { href: "/dashboard/analytics", label: "Analytics", icon: "📊" },
  { href: "/dashboard/settings", label: "Setting", icon: "⚙️" },
  { href: "/dashboard/authors", label: "Author List", icon: "👥" },
  { href: "/dashboard/ads", label: "Advertisements", icon: "📢" },
  {
    label: "News",
    icon: "🗞",
    children: [
      { href: "/dashboard/categories", label: "Categories" },
      { href: "/dashboard/subcategories", label: "SubCategories" },
      { href: "/dashboard/articles", label: "Posts" },
      { href: "/dashboard/news-ingestion", label: "News Ingestion" },
    ],
  },
  { href: "/dashboard/photo-gallery", label: "Photo Gallery", icon: "🖼" },
  { href: "/dashboard/video-gallery", label: "Video Gallery", icon: "🎬" },
  { href: "/dashboard/pages", label: "Pages", icon: "📄" },
  { href: "/dashboard/faqs", label: "FAQ Section", icon: "❓" },
  { href: "/dashboard/languages", label: "Languages", icon: "🌐" },
  { href: "/dashboard/subscribers", label: "Subscribers", icon: "📧" },
  { href: "/dashboard/live-channels", label: "Live Channel", icon: "📡" },
  { href: "/dashboard/polls", label: "Online Poll", icon: "🗳" },
  { href: "/dashboard/social-items", label: "Social Items", icon: "🔗" },
];

// Author navigation (limited).
const AUTHOR_NAV: NavEntry[] = [
  { href: "/dashboard", label: "Dashboard", icon: "🏠" },
  { href: "/dashboard/articles", label: "Posts", icon: "📰" },
  { href: "/dashboard/articles/new", label: "New Post", icon: "➕" },
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, status, setUser, setStatus, logout } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    let active = true;
    if (!getAccessToken()) {
      setStatus("anonymous");
      return;
    }
    // Render immediately from the cached user (survives a slow/failed revalidate).
    const cached = getStoredUser();
    if (cached) setUser(cached);
    authApi
      .me()
      .then((u) => active && setUser(u))
      .catch((err) => {
        if (!active) return;
        // Only log out on a *definitive* auth failure. A transient error (slow
        // backend, network blip, 5xx) keeps the cached session — otherwise a
        // refresh would bounce the user to login whenever the API is briefly
        // unresponsive.
        if (err instanceof AuthError || !cached) setStatus("anonymous");
      });
    return () => {
      active = false;
    };
  }, [setUser, setStatus]);

  useEffect(() => {
    if (status === "anonymous") router.replace("/dashboard/login");
  }, [status, router]);

  if (status !== "authenticated" || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f6fb] text-[var(--muted)]">
        Loading dashboard…
      </div>
    );
  }

  const isAdmin = canPublish(user.role);
  const panelTitle = isAdmin ? "Admin Panel" : "Author Panel";
  const nav = isAdmin ? ADMIN_NAV : AUTHOR_NAV;

  return (
    <div className="flex min-h-screen bg-[#f4f6fb]">
      {/* Sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col overflow-y-auto bg-white shadow-sm md:flex">
        <div className="px-6 py-5 text-xl font-extrabold">{panelTitle}</div>
        <nav className="flex-1 px-2 pb-6">
          {nav.map((entry) =>
            isGroup(entry) ? (
              <NavGroupItem key={entry.label} group={entry} pathname={pathname} />
            ) : (
              <NavLinkItem key={entry.href} link={entry} pathname={pathname} />
            ),
          )}
        </nav>
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="flex items-center gap-4 bg-brand px-6 py-3 text-white">
          <span className="font-semibold md:hidden">{panelTitle}</span>
          <div className="ml-auto flex items-center gap-4">
            <Link
              href="/"
              className="rounded-md bg-amber-400 px-3 py-1.5 text-sm font-semibold text-gray-900 hover:bg-amber-300"
            >
              Front End
            </Link>
            <div className="relative">
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="flex items-center gap-2 text-sm font-semibold"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                  {(user.full_name || user.username).charAt(0).toUpperCase()}
                </span>
                {user.full_name || user.username} ▾
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-full z-30 mt-1 w-44 rounded-md bg-white py-1 text-gray-700 shadow-lg">
                  <div className="px-4 py-2 text-xs capitalize text-[var(--muted)]">
                    {user.role.replace(/_/g, " ")}
                  </div>
                  <Link
                    href="/dashboard/edit-profile"
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-2 text-sm hover:bg-gray-50"
                  >
                    👤 Edit Profile
                  </Link>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      logout();
                    }}
                    className="block w-full px-4 py-2 text-left text-sm text-brand hover:bg-gray-50"
                  >
                    ⤴ Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6">{children}</main>
        <footer className="px-6 py-3 text-xs text-[var(--muted)]">
          {env.siteUrl.includes("localhost") ? "Local dev" : "Flash News"} · {panelTitle}
        </footer>
      </div>
    </div>
  );
}
