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
import { authApi } from "@/lib/auth-api";
import { getAccessToken, useAuthStore } from "@/lib/auth-store";
import { canPublish } from "@/lib/dashboard-types";
import { env } from "@/lib/env";

const NAV = [
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
    authApi.me().then((u) => active && setUser(u)).catch(() => active && setStatus("anonymous"));
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

  const panelTitle = canPublish(user.role) ? "Admin Panel" : "Author Panel";

  return (
    <div className="flex min-h-screen bg-[#f4f6fb]">
      {/* Sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col bg-white shadow-sm md:flex">
        <div className="px-6 py-5 text-xl font-extrabold">{panelTitle}</div>
        <nav className="flex-1 px-2">
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`mb-1 flex items-center gap-3 rounded-md px-4 py-2.5 text-sm font-medium transition ${
                  active ? "bg-brand/10 text-brand" : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <span aria-hidden>{item.icon}</span> {item.label}
              </Link>
            );
          })}
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
