"use client";

/**
 * Dashboard overview. Admins see platform-wide stat tiles (from /stats/);
 * authors see their own post counts. Both see recent posts.
 */
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { authApi, singleton } from "@/lib/auth-api";
import { useAuthStore } from "@/lib/auth-store";
import { canPublish } from "@/lib/dashboard-types";
import { formatDate } from "@/lib/utils";

interface Stats {
  categories: number; subcategories: number; posts: number; photos: number;
  videos: number; faqs: number; polls: number; live_channels: number;
  subscribers: number; authors: number;
}

function PageHeader({ title }: { title: string }) {
  return (
    <div className="mb-6 rounded-lg bg-white px-6 py-5 shadow-sm">
      <h1 className="text-2xl font-extrabold">{title}</h1>
    </div>
  );
}

function StatTile({ label, value, color, icon }: { label: string; value: number | string; color: string; icon: string }) {
  return (
    <div className="flex items-center gap-4 rounded-lg bg-white p-4 shadow-sm">
      <div className={`flex h-16 w-16 items-center justify-center rounded-md text-2xl text-white ${color}`}>{icon}</div>
      <div>
        <p className="text-sm text-[var(--muted)]">{label}</p>
        <p className="text-2xl font-extrabold">{value}</p>
      </div>
    </div>
  );
}

export default function OverviewPage() {
  const user = useAuthStore((s) => s.user);
  const admin = !!user && canPublish(user.role);
  const scope: Record<string, number> = user && !admin ? { author: user.id } : {};

  // The /stats/ endpoint returns a plain object (not paginated).
  const statsQuery = useQuery<Stats>({
    queryKey: ["stats"],
    queryFn: () => singleton<Stats>("stats").get(),
    enabled: admin,
  });

  const { data: articles } = useQuery({
    queryKey: ["dash-articles", scope],
    queryFn: () => authApi.listArticles({ ...scope, page_size: 100, ordering: "-created_at" }),
    enabled: !!user,
  });

  const posts = articles?.results ?? [];

  const tiles = admin && statsQuery.data
    ? [
        { label: "News Categories", value: statsQuery.data.categories, color: "bg-brand", icon: "🗂" },
        { label: "Subcategories", value: statsQuery.data.subcategories, color: "bg-accent", icon: "🧭" },
        { label: "Total Posts", value: statsQuery.data.posts, color: "bg-rose-500", icon: "📰" },
        { label: "Photo Galleries", value: statsQuery.data.photos, color: "bg-sky-500", icon: "🖼" },
        { label: "Videos", value: statsQuery.data.videos, color: "bg-amber-500", icon: "🎬" },
        { label: "FAQs", value: statsQuery.data.faqs, color: "bg-indigo-500", icon: "❓" },
        { label: "Online Polls", value: statsQuery.data.polls, color: "bg-emerald-500", icon: "🗳" },
        { label: "Live Channels", value: statsQuery.data.live_channels, color: "bg-rose-400", icon: "📡" },
        { label: "Subscribers", value: statsQuery.data.subscribers, color: "bg-sky-400", icon: "📧" },
      ]
    : [
        { label: "Total Posts", value: articles?.count ?? 0, color: "bg-brand", icon: "📰" },
        { label: "Published", value: posts.filter((a) => a.status === "published").length, color: "bg-accent", icon: "✅" },
        { label: "Drafts", value: posts.filter((a) => a.status === "draft").length, color: "bg-amber-500", icon: "📝" },
        { label: "Scheduled", value: posts.filter((a) => a.status === "scheduled").length, color: "bg-rose-500", icon: "🕒" },
      ];

  return (
    <div>
      <PageHeader title="Dashboard" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tiles.map((t) => (
          <StatTile key={t.label} {...t} />
        ))}
      </div>

      <div className="mt-6 rounded-lg bg-white p-6 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold">Recent Posts</h2>
          <Link href="/dashboard/articles/new" className="text-sm font-medium text-brand hover:underline">+ New Post</Link>
        </div>
        <ul className="divide-y divide-[var(--border)]">
          {posts.slice(0, 8).map((a) => (
            <li key={a.id} className="flex items-center justify-between py-2 text-sm">
              <Link href={`/dashboard/articles/${a.slug}/edit`} className="font-medium hover:text-brand">{a.title}</Link>
              <span className="text-xs capitalize text-[var(--muted)]">{a.status} · {formatDate(a.published_at) || "—"}</span>
            </li>
          ))}
          {posts.length === 0 && <li className="py-2 text-sm text-[var(--muted)]">No posts yet.</li>}
        </ul>
      </div>
    </div>
  );
}
