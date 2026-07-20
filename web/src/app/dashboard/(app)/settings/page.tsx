"use client";

/** Site settings — a singleton form (Home Page, Top Bar, Theme, Analytics, Disqus). */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { singleton } from "@/lib/auth-api";

interface Settings {
  site_name: string; contact_email: string; news_ticker_total: number; video_item_total: number;
  theme_color_1: string; theme_color_2: string; google_analytics_id: string; disqus_code: string;
  date_status: boolean; email_status: boolean; news_ticker_status: boolean;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}

const input = "w-full rounded-md border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-brand";

export default function SettingsPage() {
  const api = singleton<Settings>("cms/settings");
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["settings"], queryFn: () => api.get() });
  const [form, setForm] = useState<Partial<Settings>>({});

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const save = useMutation({
    mutationFn: () => api.update(form as Record<string, unknown>),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["settings"] }),
  });

  const set = (k: keyof Settings, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div>
      <div className="mb-6 rounded-lg bg-white px-6 py-5 shadow-sm">
        <h1 className="text-2xl font-extrabold">Setting</h1>
      </div>
      <div className="max-w-2xl rounded-lg bg-white p-6 shadow-sm">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate();
          }}
          className="space-y-5"
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Site Name">
              <input className={input} value={form.site_name ?? ""} onChange={(e) => set("site_name", e.target.value)} />
            </Field>
            <Field label="Email Address">
              <input className={input} value={form.contact_email ?? ""} onChange={(e) => set("contact_email", e.target.value)} />
            </Field>
            <Field label="News Ticker Total">
              <input type="number" className={input} value={form.news_ticker_total ?? 0} onChange={(e) => set("news_ticker_total", Number(e.target.value))} />
            </Field>
            <Field label="Video Item Total">
              <input type="number" className={input} value={form.video_item_total ?? 0} onChange={(e) => set("video_item_total", Number(e.target.value))} />
            </Field>
            <Field label="Theme Color 1">
              <div className="flex items-center gap-2">
                <input type="color" value={form.theme_color_1 ?? "#4f63d2"} onChange={(e) => set("theme_color_1", e.target.value)} />
                <input className={input} value={form.theme_color_1 ?? ""} onChange={(e) => set("theme_color_1", e.target.value)} />
              </div>
            </Field>
            <Field label="Theme Color 2">
              <div className="flex items-center gap-2">
                <input type="color" value={form.theme_color_2 ?? "#1dc175"} onChange={(e) => set("theme_color_2", e.target.value)} />
                <input className={input} value={form.theme_color_2 ?? ""} onChange={(e) => set("theme_color_2", e.target.value)} />
              </div>
            </Field>
            <Field label="Google Analytic ID">
              <input className={input} value={form.google_analytics_id ?? ""} onChange={(e) => set("google_analytics_id", e.target.value)} placeholder="G-XXXXXXX" />
            </Field>
          </div>
          <Field label="Disqus Code">
            <textarea rows={4} className={input} value={form.disqus_code ?? ""} onChange={(e) => set("disqus_code", e.target.value)} />
          </Field>
          <div className="flex flex-wrap gap-6 text-sm">
            <label className="flex items-center gap-2"><input type="checkbox" checked={!!form.date_status} onChange={(e) => set("date_status", e.target.checked)} /> Show date</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={!!form.email_status} onChange={(e) => set("email_status", e.target.checked)} /> Show email</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={!!form.news_ticker_status} onChange={(e) => set("news_ticker_status", e.target.checked)} /> Show ticker</label>
          </div>
          {save.isSuccess && <p className="text-sm text-accent">Settings updated.</p>}
          <button type="submit" disabled={save.isPending} className="w-full rounded-md bg-brand py-3 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60">
            {save.isPending ? "Saving…" : "Update"}
          </button>
        </form>
      </div>
    </div>
  );
}
