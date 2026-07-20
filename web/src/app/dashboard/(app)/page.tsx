"use client";

/**
 * Dashboard overview: stat tiles (counts by status) + recent articles.
 *
 * Data is fetched client-side with TanStack Query through the authenticated API
 * client. Authors see only their own articles (?author=<id>); editors see all.
 */
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { authApi } from "@/lib/auth-api";
import { useAuthStore } from "@/lib/auth-store";
import { canPublish } from "@/lib/dashboard-types";
import { formatDate } from "@/lib/utils";

function StatTile({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg border border-[var(--border)] p-4">
      <p className="text-2xl font-extrabold">{value}</p>
      <p className="text-xs uppercase tracking-wide text-[var(--muted)]">{label}</p>
    </div>
  );
}

export default function OverviewPage() {
  const user = useAuthStore((s) => s.user);
  // Non-publishers (authors/journalists) only see their own work.
  const scope: Record<string, number> = user && !canPublish(user.role) ? { author: user.id } : {};

  const { data, isPending } = useQuery({
    queryKey: ["dash-articles", scope],
    queryFn: () => authApi.listArticles({ ...scope, page_size: 100, ordering: "-created_at" }),
    enabled: !!user,
  });

  const articles = data?.results ?? [];
  const byStatus = (s: string) => articles.filter((a) => a.status === s).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">Overview</h1>
        <Link href="/dashboard/articles/new" className="text-sm font-medium text-brand hover:underline">
          + New article
        </Link>
      </div>

      {isPending ? (
        <p className="text-[var(--muted)]">Loading…</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile label="Total" value={data?.count ?? 0} />
            <StatTile label="Published" value={byStatus("published")} />
            <StatTile label="Drafts" value={byStatus("draft")} />
            <StatTile label="Scheduled" value={byStatus("scheduled")} />
          </div>

          <section>
            <h2 className="mb-2 text-lg font-bold">Recent</h2>
            <ul className="divide-y divide-[var(--border)]">
              {articles.slice(0, 8).map((a) => (
                <li key={a.id} className="flex items-center justify-between py-2 text-sm">
                  <Link href={`/dashboard/articles/${a.slug}/edit`} className="font-medium hover:underline">
                    {a.title}
                  </Link>
                  <span className="text-xs text-[var(--muted)] capitalize">
                    {a.status} · {formatDate(a.published_at) || "—"}
                  </span>
                </li>
              ))}
              {articles.length === 0 && <li className="py-2 text-sm text-[var(--muted)]">No articles yet.</li>}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
