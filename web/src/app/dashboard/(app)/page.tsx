"use client";

/**
 * Dashboard overview: a white page-header card, colored stat tiles, and a
 * recent-articles card. Data via TanStack Query through the authed API.
 * Authors see only their own articles; editors see all.
 */
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { authApi } from "@/lib/auth-api";
import { useAuthStore } from "@/lib/auth-store";
import { canPublish } from "@/lib/dashboard-types";
import { formatDate } from "@/lib/utils";

function PageHeader({ title }: { title: string }) {
  return (
    <div className="mb-6 rounded-lg bg-white px-6 py-5 shadow-sm">
      <h1 className="text-2xl font-extrabold">{title}</h1>
    </div>
  );
}

function StatTile({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div className="flex items-center gap-4 rounded-lg bg-white p-4 shadow-sm">
      <div className={`flex h-16 w-16 items-center justify-center rounded-md text-2xl text-white ${color}`}>📰</div>
      <div>
        <p className="text-sm text-[var(--muted)]">{label}</p>
        <p className="text-2xl font-extrabold">{value}</p>
      </div>
    </div>
  );
}

export default function OverviewPage() {
  const user = useAuthStore((s) => s.user);
  const scope: Record<string, number> = user && !canPublish(user.role) ? { author: user.id } : {};

  const { data, isPending } = useQuery({
    queryKey: ["dash-articles", scope],
    queryFn: () => authApi.listArticles({ ...scope, page_size: 100, ordering: "-created_at" }),
    enabled: !!user,
  });

  const articles = data?.results ?? [];
  const byStatus = (s: string) => articles.filter((a) => a.status === s).length;

  return (
    <div>
      <PageHeader title="Dashboard" />

      {isPending ? (
        <p className="text-[var(--muted)]">Loading…</p>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatTile label="Total Posts" value={data?.count ?? 0} color="bg-brand" />
            <StatTile label="Published" value={byStatus("published")} color="bg-accent" />
            <StatTile label="Drafts" value={byStatus("draft")} color="bg-amber-500" />
            <StatTile label="Scheduled" value={byStatus("scheduled")} color="bg-rose-500" />
          </div>

          <div className="rounded-lg bg-white p-6 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-bold">Recent Posts</h2>
              <Link href="/dashboard/articles/new" className="text-sm font-medium text-brand hover:underline">
                + New Post
              </Link>
            </div>
            <ul className="divide-y divide-[var(--border)]">
              {articles.slice(0, 8).map((a) => (
                <li key={a.id} className="flex items-center justify-between py-2 text-sm">
                  <Link href={`/dashboard/articles/${a.slug}/edit`} className="font-medium hover:text-brand">
                    {a.title}
                  </Link>
                  <span className="text-xs capitalize text-[var(--muted)]">
                    {a.status} · {formatDate(a.published_at) || "—"}
                  </span>
                </li>
              ))}
              {articles.length === 0 && <li className="py-2 text-sm text-[var(--muted)]">No posts yet.</li>}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
