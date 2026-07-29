"use client";

/**
 * Analytics dashboard — first-party traffic + ad performance for staff.
 *
 * Reads the pre-computed summary from `/analytics/dashboard/?days=N`
 * (apps/analytics/services.py): visitor/pageview totals and a daily trend for
 * the chosen window, traffic sources, most-read stories, top search terms, and
 * lifetime ad impression/click/CTR figures. See teaching/41-analytics-dashboard/.
 */
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { analyticsApi, type AnalyticsSummary, type TimePoint } from "@/lib/analytics-api";
import { formatDate } from "@/lib/utils";

const RANGES = [
  { days: 7, label: "7 days" },
  { days: 30, label: "30 days" },
  { days: 90, label: "90 days" },
];

const nf = new Intl.NumberFormat();
const num = (n: number) => nf.format(n);
const pct = (frac: number) => `${(frac * 100).toFixed(2)}%`;
const dur = (s: number) => (s >= 60 ? `${Math.floor(s / 60)}m ${s % 60}s` : `${s}s`);

const SOURCE_LABELS: Record<string, string> = {
  direct: "Direct",
  search: "Search engines",
  social: "Social media",
  referral: "Referral sites",
};

function Card({
  title,
  subtitle,
  children,
  className = "",
}: {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-lg bg-white p-6 shadow-sm ${className}`}>
      {title && (
        <div className="mb-4">
          <h2 className="text-lg font-bold">{title}</h2>
          {subtitle && <p className="text-xs text-[var(--muted)]">{subtitle}</p>}
        </div>
      )}
      {children}
    </section>
  );
}

function StatTile({
  label,
  value,
  icon,
  color,
  hint,
}: {
  label: string;
  value: string | number;
  icon: string;
  color: string;
  hint?: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-lg bg-white p-4 shadow-sm">
      <div
        className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-md text-xl text-white ${color}`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm text-[var(--muted)]">{label}</p>
        <p className="text-2xl font-extrabold">{value}</p>
        {hint && <p className="text-xs text-[var(--muted)]">{hint}</p>}
      </div>
    </div>
  );
}

/** Two-series daily trend (visitors + pageviews) as a responsive SVG. */
function TrendChart({ points }: { points: TimePoint[] }) {
  const W = 720;
  const H = 220;
  const pad = { top: 12, right: 12, bottom: 24, left: 36 };
  const iw = W - pad.left - pad.right;
  const ih = H - pad.top - pad.bottom;
  const max = Math.max(1, ...points.map((p) => Math.max(p.pageviews, p.visitors)));
  const n = points.length;
  const x = (i: number) => pad.left + (n <= 1 ? iw / 2 : (i / (n - 1)) * iw);
  const y = (v: number) => pad.top + ih - (v / max) * ih;
  const line = (key: "pageviews" | "visitors") =>
    points
      .map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(p[key]).toFixed(1)}`)
      .join(" ");
  const area = `${line("pageviews")} L${x(n - 1).toFixed(1)},${(pad.top + ih).toFixed(1)} L${x(0).toFixed(1)},${(pad.top + ih).toFixed(1)} Z`;
  const ticks = [0, 0.5, 1].map((f) => Math.round(max * f));
  const labelIdx = n <= 1 ? [0] : [0, Math.floor((n - 1) / 2), n - 1];

  return (
    <div>
      <div className="mb-2 flex items-center gap-4 text-xs">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-brand" /> Pageviews
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-accent" /> Visitors
        </span>
      </div>
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="h-56 w-full min-w-[560px]"
          role="img"
          aria-label="Daily pageviews and visitors"
        >
          {ticks.map((t, i) => {
            const gy = y(t);
            return (
              <g key={i}>
                <line
                  x1={pad.left}
                  x2={W - pad.right}
                  y1={gy}
                  y2={gy}
                  stroke="var(--border)"
                  strokeWidth={1}
                />
                <text
                  x={pad.left - 6}
                  y={gy + 3}
                  textAnchor="end"
                  fontSize={10}
                  fill="var(--muted)"
                >
                  {num(t)}
                </text>
              </g>
            );
          })}
          <path d={area} className="fill-brand/10" />
          <path
            d={line("pageviews")}
            className="stroke-brand"
            fill="none"
            strokeWidth={2}
            strokeLinejoin="round"
          />
          <path
            d={line("visitors")}
            className="stroke-accent"
            fill="none"
            strokeWidth={2}
            strokeLinejoin="round"
          />
          {labelIdx.map((i) => (
            <text
              key={i}
              x={x(i)}
              y={H - 6}
              textAnchor={i === 0 ? "start" : i === n - 1 ? "end" : "middle"}
              fontSize={10}
              fill="var(--muted)"
            >
              {points[i]?.date.slice(5)}
            </text>
          ))}
        </svg>
      </div>
    </div>
  );
}

/** Horizontal bar list (traffic sources, most-read stories). */
function BarList({ rows }: { rows: { label: React.ReactNode; value: number; key: string }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  if (rows.length === 0) return <p className="py-4 text-sm text-[var(--muted)]">No data yet.</p>;
  return (
    <ul className="space-y-2.5">
      {rows.map((r) => (
        <li key={r.key}>
          <div className="mb-1 flex items-center justify-between gap-3 text-sm">
            <span className="min-w-0 truncate">{r.label}</span>
            <span className="shrink-0 font-semibold tabular-nums">{num(r.value)}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-brand"
              style={{ width: `${(r.value / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function AnalyticsPage() {
  const [days, setDays] = useState(30);
  const { data, isPending, isError } = useQuery<AnalyticsSummary>({
    queryKey: ["analytics", days],
    queryFn: () => analyticsApi.dashboard(days),
  });

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-white px-6 py-5 shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold">Analytics</h1>
          {data && (
            <p className="mt-1 text-sm text-[var(--muted)]">
              {formatDate(data.since)} – {formatDate(data.until)}
            </p>
          )}
        </div>
        <div className="flex gap-1 rounded-md border border-[var(--border)] p-1">
          {RANGES.map((r) => (
            <button
              key={r.days}
              onClick={() => setDays(r.days)}
              className={`rounded px-3 py-1.5 text-sm font-medium transition ${days === r.days ? "bg-brand text-white" : "text-gray-600 hover:bg-gray-50"}`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {isError && (
        <Card>
          <p className="text-sm text-rose-600">
            Couldn&apos;t load analytics. Check you&apos;re signed in as staff and the API is
            running.
          </p>
        </Card>
      )}
      {isPending && !data && (
        <Card>
          <p className="text-sm text-[var(--muted)]">Loading analytics…</p>
        </Card>
      )}

      {data && (
        <div className="space-y-6">
          {/* Traffic tiles (respect the selected window) */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatTile
              label="Visitors"
              value={num(data.totals.visitors)}
              icon="👥"
              color="bg-brand"
              hint={`last ${days} days`}
            />
            <StatTile
              label="Pageviews"
              value={num(data.totals.pageviews)}
              icon="👁"
              color="bg-accent"
              hint={`last ${days} days`}
            />
            <StatTile
              label="Avg. read time"
              value={dur(data.totals.avg_read_seconds)}
              icon="⏱"
              color="bg-sky-500"
              hint="per pageview"
            />
            <StatTile
              label="Published posts"
              value={num(data.totals.articles_published)}
              icon="📰"
              color="bg-indigo-500"
              hint={`${num(data.totals.articles_total)} total`}
            />
          </div>

          {/* Ad tiles (lifetime) */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatTile
              label="Ad impressions"
              value={num(data.totals.ad_impressions)}
              icon="📢"
              color="bg-amber-500"
              hint="lifetime"
            />
            <StatTile
              label="Ad clicks"
              value={num(data.totals.ad_clicks)}
              icon="🖱"
              color="bg-rose-500"
              hint="lifetime"
            />
            <StatTile
              label="Ad CTR"
              value={pct(data.totals.ad_ctr)}
              icon="🎯"
              color="bg-emerald-500"
              hint="clicks ÷ impressions"
            />
            <StatTile
              label="Subscribers"
              value={num(data.totals.subscribers)}
              icon="📧"
              color="bg-sky-400"
              hint="active"
            />
          </div>

          <Card
            title="Traffic over time"
            subtitle={`Daily pageviews and unique visitors, last ${days} days`}
          >
            <TrendChart points={data.timeseries} />
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card title="Traffic sources" subtitle="Where visitors came from">
              <BarList
                rows={data.sources.map((s) => ({
                  key: s.source,
                  label: SOURCE_LABELS[s.source] ?? s.source,
                  value: s.count,
                }))}
              />
            </Card>
            <Card title="Most-read stories" subtitle={`Top articles, last ${days} days`}>
              <BarList
                rows={data.top_articles.map((a) => ({
                  key: a.slug,
                  value: a.views,
                  label: (
                    <a
                      href={`/articles/${a.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:text-brand"
                    >
                      {a.title}
                    </a>
                  ),
                }))}
              />
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card
              title="Top search terms"
              subtitle={`What visitors searched for, last ${days} days`}
            >
              {data.top_searches.length === 0 ? (
                <p className="py-4 text-sm text-[var(--muted)]">No searches yet.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border)] text-left text-xs uppercase text-[var(--muted)]">
                      <th className="py-2 pr-4">Query</th>
                      <th className="py-2 pr-4 text-right">Searches</th>
                      <th className="py-2 text-right">Avg. results</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.top_searches.map((s) => (
                      <tr key={s.query} className="border-b border-[var(--border)]">
                        <td className="py-2 pr-4 font-medium">{s.query}</td>
                        <td className="py-2 pr-4 text-right tabular-nums">{num(s.count)}</td>
                        <td
                          className={`py-2 text-right tabular-nums ${s.avg_results === 0 ? "text-rose-500" : ""}`}
                        >
                          {s.avg_results}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>

            <Card
              title="Ad performance by placement"
              subtitle="Lifetime impressions, clicks and CTR"
            >
              {data.ads.by_placement.length === 0 ? (
                <p className="py-4 text-sm text-[var(--muted)]">No ads configured.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border)] text-left text-xs uppercase text-[var(--muted)]">
                      <th className="py-2 pr-4">Placement</th>
                      <th className="py-2 pr-4 text-right">Impr.</th>
                      <th className="py-2 pr-4 text-right">Clicks</th>
                      <th className="py-2 text-right">CTR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.ads.by_placement.map((p) => (
                      <tr key={p.placement} className="border-b border-[var(--border)]">
                        <td className="py-2 pr-4 font-medium capitalize">
                          {p.placement.replace("_", " ")}
                        </td>
                        <td className="py-2 pr-4 text-right tabular-nums">{num(p.impressions)}</td>
                        <td className="py-2 pr-4 text-right tabular-nums">{num(p.clicks)}</td>
                        <td className="py-2 text-right tabular-nums">{pct(p.ctr)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>
          </div>

          <Card title="Ad performance by creative" subtitle="Lifetime, ranked by clicks">
            {data.ads.by_ad.length === 0 ? (
              <p className="py-4 text-sm text-[var(--muted)]">No ads configured.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border)] text-left text-xs uppercase text-[var(--muted)]">
                      <th className="py-2 pr-4">Ad</th>
                      <th className="py-2 pr-4">Placement</th>
                      <th className="py-2 pr-4">Status</th>
                      <th className="py-2 pr-4 text-right">Impressions</th>
                      <th className="py-2 pr-4 text-right">Clicks</th>
                      <th className="py-2 text-right">CTR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.ads.by_ad.map((a) => (
                      <tr key={a.id} className="border-b border-[var(--border)]">
                        <td className="py-2 pr-4 font-medium">{a.name}</td>
                        <td className="py-2 pr-4 capitalize text-[var(--muted)]">
                          {a.placement.replace("_", " ")}
                        </td>
                        <td className="py-2 pr-4">
                          <span
                            className={`rounded px-2 py-0.5 text-xs font-medium ${a.is_active ? "bg-emerald-100 text-emerald-700" : "bg-gray-200 text-gray-600"}`}
                          >
                            {a.is_active ? "Active" : "Paused"}
                          </span>
                        </td>
                        <td className="py-2 pr-4 text-right tabular-nums">{num(a.impressions)}</td>
                        <td className="py-2 pr-4 text-right tabular-nums">{num(a.clicks)}</td>
                        <td className="py-2 text-right tabular-nums">{pct(a.ctr)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <p className="text-xs text-[var(--muted)]">
            Visitor metrics are first-party (privacy-friendly, cookie-free session estimates) and
            cover the selected window; logged-in newsroom staff are excluded. Ad figures are
            lifetime totals. New pageviews appear as visitors browse the public site.
          </p>
        </div>
      )}
    </div>
  );
}
