"use client";

/** Subscribers list (read-only) + a "Send Email to All" action. */
import { useMutation, useQuery } from "@tanstack/react-query";
import { postAction, resource } from "@/lib/auth-api";
import { formatDate } from "@/lib/utils";

interface Subscriber { id: number; email: string; is_confirmed: boolean; is_active: boolean; created_at: string }

export default function SubscribersPage() {
  const { data: subs = [], isPending } = useQuery({
    queryKey: ["subscribers"],
    queryFn: () => resource<Subscriber>("newsletter/subscribers").list({ page_size: 200 }),
  });

  const send = useMutation({
    mutationFn: () => postAction("/newsletter/subscribers/send-email/"),
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between rounded-lg bg-white px-6 py-5 shadow-sm">
        <h1 className="text-2xl font-extrabold">All Subscribers</h1>
        <button
          onClick={() => send.mutate()}
          disabled={send.isPending}
          className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
        >
          {send.isPending ? "Queuing…" : "Send Email to All"}
        </button>
      </div>

      {send.isSuccess && (
        <p className="mb-4 rounded-md bg-accent/10 px-4 py-2 text-sm text-accent">
          Email queued to {(send.data as { recipients?: number })?.recipients ?? 0} active subscribers.
        </p>
      )}

      <div className="rounded-lg bg-white p-6 shadow-sm">
        {isPending ? (
          <p className="text-[var(--muted)]">Loading…</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-left text-xs uppercase text-[var(--muted)]">
                <th className="py-2 pr-4">SL</th>
                <th className="py-2 pr-4">Subscriber Email</th>
                <th className="py-2 pr-4">Confirmed</th>
                <th className="py-2">Joined</th>
              </tr>
            </thead>
            <tbody>
              {subs.map((s, i) => (
                <tr key={s.id} className="border-b border-[var(--border)]">
                  <td className="py-3 pr-4 text-[var(--muted)]">{i + 1}</td>
                  <td className="py-3 pr-4 font-medium">{s.email}</td>
                  <td className="py-3 pr-4">{s.is_confirmed ? "Yes" : "No"}</td>
                  <td className="py-3 text-[var(--muted)]">{formatDate(s.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {subs.length === 0 && !isPending && <p className="py-4 text-[var(--muted)]">No subscribers yet.</p>}
      </div>
    </div>
  );
}
