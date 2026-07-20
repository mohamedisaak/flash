"use client";

/**
 * The gated dashboard shell: bootstraps auth, redirects anonymous users to the
 * login page, and renders the sidebar + content for authenticated staff.
 *
 * Auth bootstrap: on mount, if a token exists, fetch the current user (`/auth/me`)
 * and store it; otherwise mark anonymous. A second effect performs the redirect.
 * See teaching/12-nextjs/07-dashboard-and-forms.md.
 */
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { authApi } from "@/lib/auth-api";
import { getAccessToken, useAuthStore } from "@/lib/auth-store";
import { canPublish } from "@/lib/dashboard-types";

const NAV = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/articles", label: "Articles" },
  { href: "/dashboard/articles/new", label: "New article" },
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, status, setUser, setStatus, logout } = useAuthStore();

  useEffect(() => {
    let active = true;
    if (!getAccessToken()) {
      setStatus("anonymous");
      return;
    }
    authApi
      .me()
      .then((u) => active && setUser(u))
      .catch(() => active && setStatus("anonymous"));
    return () => {
      active = false;
    };
  }, [setUser, setStatus]);

  useEffect(() => {
    if (status === "anonymous") router.replace("/dashboard/login");
  }, [status, router]);

  if (status !== "authenticated" || !user) {
    return <div className="py-20 text-center text-[var(--muted)]">Loading dashboard…</div>;
  }

  return (
    <div className="grid gap-6 md:grid-cols-[200px_1fr]">
      <aside className="md:border-r md:border-[var(--border)] md:pr-4">
        <div className="mb-4 text-sm">
          <p className="font-semibold">{user.full_name || user.username}</p>
          <p className="text-[var(--muted)] capitalize">{user.role.replace(/_/g, " ")}</p>
        </div>
        <nav className="flex flex-col gap-1 text-sm">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded px-2 py-1.5 hover:bg-gray-100 ${pathname === item.href ? "bg-gray-100 font-medium" : ""}`}
            >
              {item.label}
            </Link>
          ))}
          <button onClick={logout} className="mt-2 rounded px-2 py-1.5 text-left text-brand hover:bg-gray-100">
            Log out
          </button>
        </nav>
        {!canPublish(user.role) && (
          <p className="mt-4 text-xs text-[var(--muted)]">
            Your role can submit drafts for review, but not publish directly.
          </p>
        )}
      </aside>
      <section>{children}</section>
    </div>
  );
}
