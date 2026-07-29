"use client";

/** Posts management table (NewsPortal admin style). Authors see own; editors all. */
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { authApi } from "@/lib/auth-api";
import { useAuthStore } from "@/lib/auth-store";
import { canPublish } from "@/lib/dashboard-types";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export default function ArticlesListPage() {
  const user = useAuthStore((s) => s.user);
  const scope: Record<string, number> = user && !canPublish(user.role) ? { author: user.id } : {};

  const { data, isPending } = useQuery({
    queryKey: ["dash-articles-list", scope],
    queryFn: () => authApi.listArticles({ ...scope, page_size: 100, ordering: "-created_at" }),
    enabled: !!user,
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between rounded-lg bg-white px-6 py-5 shadow-sm">
        <h1 className="text-2xl font-extrabold">Posts</h1>
        <Link
          href="/dashboard/articles/new"
          className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
        >
          + Add
        </Link>
      </div>

      <div className="rounded-lg bg-white p-6 shadow-sm">
        {isPending ? (
          <p className="text-[var(--muted)]">Loading…</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-left text-xs uppercase text-[var(--muted)]">
                  <th className="py-2 pr-4">SL</th>
                  <th className="py-2 pr-4">Post Title</th>
                  <th className="py-2 pr-4">Category</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Published</th>
                  <th className="py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {(data?.results ?? []).map((a, i) => (
                  <tr key={a.id} className="border-b border-[var(--border)]">
                    <td className="py-3 pr-4 text-[var(--muted)]">{i + 1}</td>
                    <td className="py-3 pr-4 font-medium">{a.title}</td>
                    <td className="py-3 pr-4">{a.category.name}</td>
                    <td className="py-3 pr-4">
                      <Badge variant={a.status === "published" ? "accent" : "default"}>
                        {a.status}
                      </Badge>
                    </td>
                    <td className="py-3 pr-4 text-[var(--muted)]">
                      {formatDate(a.published_at) || "—"}
                    </td>
                    <td className="py-3">
                      <Link
                        href={`/dashboard/articles/${a.slug}/edit`}
                        className="rounded bg-brand px-3 py-1 text-xs font-semibold text-white hover:bg-brand-dark"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(data?.results.length ?? 0) === 0 && (
              <p className="py-4 text-[var(--muted)]">No posts yet.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
