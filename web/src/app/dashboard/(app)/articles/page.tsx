"use client";

/** Article management list. Authors see their own; editors see everything. */
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
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">Articles</h1>
        <Link href="/dashboard/articles/new" className="text-sm font-medium text-brand hover:underline">
          + New article
        </Link>
      </div>

      {isPending ? (
        <p className="text-[var(--muted)]">Loading…</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-left text-xs uppercase text-[var(--muted)]">
                <th className="py-2">Title</th>
                <th className="py-2">Status</th>
                <th className="py-2">Published</th>
                <th className="py-2"></th>
              </tr>
            </thead>
            <tbody>
              {(data?.results ?? []).map((a) => (
                <tr key={a.id} className="border-b border-[var(--border)]">
                  <td className="py-2 font-medium">{a.title}</td>
                  <td className="py-2">
                    <Badge variant={a.status === "published" ? "brand" : "default"}>{a.status}</Badge>
                  </td>
                  <td className="py-2 text-[var(--muted)]">{formatDate(a.published_at) || "—"}</td>
                  <td className="py-2 text-right">
                    <Link href={`/dashboard/articles/${a.slug}/edit`} className="text-brand hover:underline">
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {(data?.results.length ?? 0) === 0 && <p className="py-4 text-[var(--muted)]">No articles yet.</p>}
        </div>
      )}
    </div>
  );
}
