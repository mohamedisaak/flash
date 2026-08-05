"use client";

/**
 * News Ingestion — the aggregation control room.
 *
 * A richer take on a job-board-style ingestion panel: run ingestion from Kenyan
 * + international RSS and global news APIs, then *browse and moderate* the
 * ingested items (search/filter, per-row and bulk actions), promote them to the
 * public site (publish) or into drafts, moderate or delete by source, and review
 * run history. All calls are staff-only via `ingestionApi`.
 *
 * See teaching/40-news-aggregation/.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  ingestionApi,
  type AggItem,
  type BulkAction,
  type IngestSource,
  type RunSummary,
} from "@/lib/ingestion-api";
import { synthesisApi, type SynthesisJob } from "@/lib/synthesis-api";
import { formatDate } from "@/lib/utils";

/** Pull the human-readable `detail` out of an `apiRequest` error string. */
function errorDetail(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e);
  const brace = msg.indexOf("{");
  if (brace !== -1) {
    try {
      const parsed = JSON.parse(msg.slice(brace)) as { detail?: string };
      if (parsed.detail) return parsed.detail;
    } catch {
      /* fall through to the raw message */
    }
  }
  return msg;
}

const REGION_LABELS: Record<string, string> = {
  kenya: "🇰🇪 Kenyan press",
  international: "🌍 International",
  global: "🛰 Global news APIs",
};
const PAGE_SIZE = 25;

function Card({
  title,
  danger,
  children,
}: {
  title: string;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section
      className={`mb-6 rounded-lg bg-white p-6 shadow-sm ${danger ? "border border-rose-200" : ""}`}
    >
      <h2 className={`mb-4 text-lg font-bold ${danger ? "text-rose-600" : ""}`}>{title}</h2>
      {children}
    </section>
  );
}

function StatusPill({ item }: { item: AggItem }) {
  if (item.is_imported)
    return (
      <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
        Published/Imported
      </span>
    );
  if (item.is_hidden)
    return (
      <span className="rounded bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-600">
        Hidden
      </span>
    );
  return (
    <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">New</span>
  );
}

export default function NewsIngestionPage() {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["agg-items"] });
    qc.invalidateQueries({ queryKey: ["agg-sources"] });
    qc.invalidateQueries({ queryKey: ["agg-stats"] });
    qc.invalidateQueries({ queryKey: ["agg-runs"] });
  };

  const { data: sources = [] } = useQuery({
    queryKey: ["agg-sources"],
    queryFn: ingestionApi.sources,
  });
  const { data: stats } = useQuery({ queryKey: ["agg-stats"], queryFn: ingestionApi.stats });
  const { data: runs } = useQuery({ queryKey: ["agg-runs"], queryFn: ingestionApi.runs });
  const { data: categoriesPage } = useQuery({
    queryKey: ["agg-categories"],
    queryFn: ingestionApi.categories,
  });
  // Is the local AI model reachable? Drives the synthesis banner + button state.
  const { data: aiStatus } = useQuery({
    queryKey: ["synth-status"],
    queryFn: synthesisApi.status,
  });

  // Section an imported item is filed under. The admin picks it here instead of
  // it being auto-derived from the source's region. "World" is always offered
  // even if it doesn't exist yet — the backend creates it on first import.
  // "" = Auto: file each item into the section it was crawled for (else World).
  const [importCategory, setImportCategory] = useState("");
  const categoryOptions = useMemo(() => {
    const rows = categoriesPage?.results ?? [];
    const opts = rows.map((c) => ({ slug: c.slug, name: c.name }));
    if (!opts.some((o) => o.slug === "world")) opts.unshift({ slug: "world", name: "World" });
    opts.unshift({ slug: "", name: "Auto — by crawled section" });
    return opts;
  }, [categoriesPage]);

  // Crawlable sections (Sports, Business, …) for section-scoped Kenyan crawling.
  const { data: crawlCats = [] } = useQuery({
    queryKey: ["agg-crawl-cats"],
    queryFn: ingestionApi.crawlCategories,
  });
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const toggleCategory = (slug: string) =>
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      next.has(slug) ? next.delete(slug) : next.add(slug);
      return next;
    });

  // ---- Run ingestion state ----
  const [selectedSources, setSelectedSources] = useState<Set<string>>(new Set());
  const [maxItems, setMaxItems] = useState(25);
  const [dryRun, setDryRun] = useState(false);
  const [lastRun, setLastRun] = useState<RunSummary | null>(null);

  const grouped = useMemo(() => {
    const g: Record<string, IngestSource[]> = { kenya: [], international: [], global: [] };
    for (const s of sources) g[s.region]?.push(s);
    return g;
  }, [sources]);

  const toggleSource = (slug: string) =>
    setSelectedSources((prev) => {
      const next = new Set(prev);
      next.has(slug) ? next.delete(slug) : next.add(slug);
      return next;
    });
  const selectAll = () =>
    setSelectedSources(new Set(sources.filter((s) => s.available).map((s) => s.slug)));
  const clearAll = () => setSelectedSources(new Set());

  const run = useMutation({
    mutationFn: () =>
      ingestionApi.run({
        sources: selectedSources.size
          ? [...selectedSources]
          : sources.filter((s) => s.available).map((s) => s.slug),
        categories: selectedCategories.size ? [...selectedCategories] : undefined,
        max_items: maxItems,
        dry_run: dryRun,
      }),
    onSuccess: (summary) => {
      setLastRun(summary);
      invalidate();
    },
  });

  // ---- Items browser state ----
  const [filterSource, setFilterSource] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "new" | "imported" | "hidden">("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const itemParams = {
    source: filterSource || undefined,
    is_hidden: filterStatus === "hidden" ? true : filterStatus === "new" ? false : undefined,
    search: search || undefined,
    page,
    page_size: PAGE_SIZE,
  };
  const { data: itemsPage, isPending: itemsLoading } = useQuery({
    queryKey: ["agg-items", itemParams],
    queryFn: () => ingestionApi.listItems(itemParams),
  });
  // "imported" isn't a backend filter field; narrow client-side for that view.
  const items = useMemo(() => {
    const rows = itemsPage?.results ?? [];
    if (filterStatus === "imported") return rows.filter((r) => r.is_imported);
    if (filterStatus === "new") return rows.filter((r) => !r.is_imported && !r.is_hidden);
    return rows;
  }, [itemsPage, filterStatus]);

  const toggleRow = (id: number) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  const allOnPageSelected = items.length > 0 && items.every((r) => selected.has(r.id));
  const toggleAllOnPage = () =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (allOnPageSelected) items.forEach((r) => next.delete(r.id));
      else items.forEach((r) => next.add(r.id));
      return next;
    });

  const bulk = useMutation({
    mutationFn: (action: BulkAction) => ingestionApi.bulk(action, [...selected], importCategory),
    onSuccess: () => {
      setSelected(new Set());
      invalidate();
    },
  });

  // ---- AI synthesis (combine the selected sources into ONE original draft) ----
  const [angle, setAngle] = useState("");
  const [synthResult, setSynthResult] = useState<SynthesisJob | null>(null);
  const [synthError, setSynthError] = useState<string | null>(null);
  const synth = useMutation({
    mutationFn: () =>
      synthesisApi.run({ ids: [...selected], angle: angle.trim(), category: importCategory }),
    onSuccess: (job) => {
      setSynthError(null);
      setSynthResult(job);
      setAngle("");
      setSelected(new Set());
      invalidate();
    },
    onError: (e) => {
      setSynthResult(null);
      setSynthError(errorDetail(e));
    },
  });
  const rowAction = useMutation({
    mutationFn: (v: { id: number; kind: "publish" | "draft" | "hide" | "unhide" | "fetch" }) => {
      if (v.kind === "publish") return ingestionApi.itemImport(v.id, true, importCategory);
      if (v.kind === "draft") return ingestionApi.itemImport(v.id, false, importCategory);
      if (v.kind === "fetch") return ingestionApi.fetchContent(v.id);
      return ingestionApi.itemHide(v.id, v.kind === "hide");
    },
    onSuccess: invalidate,
  });

  // ---- Full-article preview ----
  const [previewId, setPreviewId] = useState<number | null>(null);
  const { data: preview, isPending: previewLoading } = useQuery({
    queryKey: ["agg-item", previewId],
    queryFn: () => ingestionApi.getItem(previewId as number),
    enabled: previewId !== null,
  });

  // ---- Moderation / removal state ----
  const [modSource, setModSource] = useState("");
  const sourceMut = useMutation({
    mutationFn: (v: { kind: "hide" | "unhide" | "delete"; slug: string }) =>
      v.kind === "delete"
        ? ingestionApi.deleteSource(v.slug)
        : ingestionApi.hideSource(v.slug, v.kind === "hide"),
    onSuccess: invalidate,
  });
  const deleteAll = useMutation({ mutationFn: ingestionApi.deleteAll, onSuccess: invalidate });
  const clearRuns = useMutation({ mutationFn: ingestionApi.clearRuns, onSuccess: invalidate });

  const totalItems = itemsPage?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const btn =
    "rounded-md border border-[var(--border)] px-3 py-1.5 text-sm font-medium hover:bg-gray-50 disabled:opacity-50";
  const btnBrand =
    "rounded-md bg-brand px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60";

  return (
    <div>
      <div className="mb-6 rounded-lg bg-white px-6 py-5 shadow-sm">
        <h1 className="text-2xl font-extrabold">News Ingestion</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Aggregate headlines from Kenyan &amp; international newsrooms and global APIs, then
          moderate and publish them to your site. Imported posts keep a source credit; the outbound
          link is removed.
        </p>
        {stats && (
          <p className="mt-2 text-sm">
            <strong>{stats.total}</strong> ingested · <strong>{stats.imported}</strong> imported ·{" "}
            <strong>{stats.hidden}</strong> hidden
          </p>
        )}
        {aiStatus &&
          (aiStatus.enabled ? (
            <p className="mt-2 text-xs text-emerald-700">
              ✨ AI synthesis ready — <strong>{aiStatus.provider}</strong> · {aiStatus.model}. Select
              one or more sources below and “Synthesise” to draft an original, cited article.
            </p>
          ) : (
            <p className="mt-2 text-xs text-amber-700">
              AI synthesis is off — {aiStatus.reason} See <code>.env</code> (<code>AI_PROVIDER</code>
              ).
            </p>
          ))}
      </div>

      {/* ---------- Run ingestion ---------- */}
      <Card title="Run ingestion">
        <div className="mb-3 flex items-center gap-3">
          <span className="text-sm font-medium text-[var(--muted)]">Sources</span>
          <button onClick={selectAll} className="text-xs font-medium text-brand hover:underline">
            Select all
          </button>
          <button
            onClick={clearAll}
            className="text-xs font-medium text-[var(--muted)] hover:underline"
          >
            Clear
          </button>
        </div>
        <div className="space-y-4">
          {(["kenya", "international", "global"] as const).map((region) => (
            <div key={region}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                {REGION_LABELS[region]}
              </p>
              <div className="flex flex-wrap gap-2">
                {grouped[region]?.map((s) => (
                  <label
                    key={s.slug}
                    className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm ${
                      s.available
                        ? "cursor-pointer border-[var(--border)] hover:border-brand"
                        : "cursor-not-allowed border-dashed border-gray-300 opacity-60"
                    } ${selectedSources.has(s.slug) ? "border-brand bg-brand/5" : ""}`}
                    title={
                      s.available
                        ? s.homepage
                        : "Set this provider's API key in the backend .env to enable it"
                    }
                  >
                    <input
                      type="checkbox"
                      disabled={!s.available}
                      checked={selectedSources.has(s.slug)}
                      onChange={() => toggleSource(s.slug)}
                    />
                    {s.name}
                    <span className="rounded-full bg-gray-100 px-1.5 text-xs text-gray-500">
                      {s.count}
                    </span>
                    {!s.available && <span className="text-xs text-amber-600">needs key</span>}
                    {s.paywalled && (
                      <span
                        className="text-xs text-amber-600"
                        title="Membership site — imports use the summary, not the full body"
                      >
                        membership
                      </span>
                    )}
                  </label>
                ))}
              </div>

              {/* Section-scoped crawling — only under the Kenyan press group. */}
              {region === "kenya" && crawlCats.length > 0 && (
                <div className="mt-3 rounded-md border border-dashed border-[var(--border)] bg-gray-50 p-3">
                  <p className="mb-2 text-xs font-medium text-[var(--muted)]">
                    Crawl by section (optional) — pick one or more to pull only those sections from
                    the selected Kenyan sources. Leave all unchecked to crawl whole sites.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {crawlCats.map((c) => (
                      <label
                        key={c.slug}
                        className={`flex cursor-pointer items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-sm ${
                          selectedCategories.has(c.slug)
                            ? "border-brand bg-brand/5"
                            : "border-[var(--border)] hover:border-brand"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedCategories.has(c.slug)}
                          onChange={() => toggleCategory(c.slug)}
                        />
                        {c.label}
                      </label>
                    ))}
                    {selectedCategories.size > 0 && (
                      <button
                        onClick={() => setSelectedCategories(new Set())}
                        className="text-xs text-[var(--muted)] hover:underline"
                      >
                        clear sections
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap items-end gap-6">
          <label className="text-sm">
            <span className="mb-1 block font-medium">Max items per source</span>
            <input
              type="number"
              min={1}
              max={100}
              value={maxItems}
              onChange={(e) => setMaxItems(Math.max(1, Math.min(100, Number(e.target.value) || 1)))}
              className="w-28 rounded-md border border-[var(--border)] px-3 py-2 text-sm"
            />
          </label>
          <label className="flex items-center gap-2 pb-2 text-sm">
            <input type="checkbox" checked={dryRun} onChange={(e) => setDryRun(e.target.checked)} />
            Dry run (parse only, no database writes)
          </label>
          <button
            onClick={() => run.mutate()}
            disabled={run.isPending}
            className={`${btnBrand} !px-5 !py-2.5`}
          >
            {run.isPending ? "Ingesting… (up to a minute)" : "Start ingestion"}
          </button>
        </div>

        {lastRun && (
          <div className="mt-5 rounded-md bg-gray-50 p-4 text-sm">
            <p className="font-semibold">
              {lastRun.dry_run ? "Dry run" : "Run"} complete — +{lastRun.created} new, ~
              {lastRun.updated} updated
              {lastRun.error ? `, ${lastRun.error} error(s)` : ""}.
            </p>
            <div className="mt-2 grid gap-1 sm:grid-cols-2 lg:grid-cols-3">
              {Object.entries(lastRun.detail).map(([slug, d]) => (
                <div key={slug} className="flex items-center gap-2">
                  <span
                    className={`h-2 w-2 rounded-full ${d.error ? "bg-rose-500" : d.created || d.updated ? "bg-emerald-500" : "bg-gray-300"}`}
                  />
                  <span className="font-medium">{slug}</span>
                  <span className="text-[var(--muted)]">
                    +{d.created} ~{d.updated}
                    {d.message ? ` · ${d.message}` : ""}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* ---------- Ingested items ---------- */}
      <Card title="Ingested items">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <input
            placeholder="Search title/source…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-56 rounded-md border border-[var(--border)] px-3 py-2 text-sm"
          />
          <select
            value={filterSource}
            onChange={(e) => {
              setFilterSource(e.target.value);
              setPage(1);
            }}
            className="rounded-md border border-[var(--border)] px-3 py-2 text-sm"
          >
            <option value="">All sources</option>
            {sources.map((s) => (
              <option key={s.slug} value={s.slug}>
                {s.name} ({s.count})
              </option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value as typeof filterStatus);
              setPage(1);
            }}
            className="rounded-md border border-[var(--border)] px-3 py-2 text-sm"
          >
            <option value="all">All statuses</option>
            <option value="new">New</option>
            <option value="imported">Imported</option>
            <option value="hidden">Hidden</option>
          </select>
          <label className="flex items-center gap-2 text-sm">
            <span className="font-medium text-[var(--muted)]">Import into</span>
            <select
              value={importCategory}
              onChange={(e) => setImportCategory(e.target.value)}
              className="rounded-md border border-[var(--border)] px-3 py-2 text-sm"
              title="Editorial section that published/drafted items are filed under"
            >
              {categoryOptions.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <span className="ml-auto text-sm text-[var(--muted)]">{totalItems} item(s)</span>
        </div>

        {selected.size > 0 && (
          <div className="mb-3 flex flex-wrap items-center gap-2 rounded-md bg-brand/5 px-3 py-2 text-sm">
            <span className="font-medium">{selected.size} selected</span>
            <button
              onClick={() => bulk.mutate("publish")}
              disabled={bulk.isPending}
              className={btnBrand}
            >
              Publish to site
            </button>
            <button
              onClick={() => bulk.mutate("import_draft")}
              disabled={bulk.isPending}
              className={btn}
            >
              Import as draft
            </button>
            <span className="text-xs text-[var(--muted)]">
              into{" "}
              <strong>
                {categoryOptions.find((c) => c.slug === importCategory)?.name ?? importCategory}
              </strong>
            </span>
            <span className="mx-1 hidden h-5 w-px bg-gray-300 sm:block" />
            <input
              value={angle}
              onChange={(e) => setAngle(e.target.value)}
              placeholder="Optional angle for the AI piece…"
              className="w-52 rounded-md border border-[var(--border)] px-2 py-1 text-xs"
              title="Steer the framing, e.g. 'focus on the economic impact'"
            />
            <button
              onClick={() => synth.mutate()}
              disabled={synth.isPending || !aiStatus?.enabled}
              className={btnBrand}
              title={
                aiStatus?.enabled
                  ? "Write ONE original, cited draft that synthesises all selected sources"
                  : (aiStatus?.reason ?? "AI synthesis is not configured")
              }
            >
              {synth.isPending ? "Synthesising… (up to a minute)" : "✨ Synthesise article (AI)"}
            </button>
            <button
              onClick={() => bulk.mutate("fetch_content")}
              disabled={bulk.isPending}
              className={btn}
              title="Fetch the full article body for the selected items (slower)"
            >
              Fetch full content
            </button>
            <button onClick={() => bulk.mutate("hide")} disabled={bulk.isPending} className={btn}>
              Hide
            </button>
            <button onClick={() => bulk.mutate("unhide")} disabled={bulk.isPending} className={btn}>
              Unhide
            </button>
            <button
              onClick={() => {
                if (confirm(`Delete ${selected.size} item(s)?`)) bulk.mutate("delete");
              }}
              disabled={bulk.isPending}
              className={`${btn} text-rose-600`}
            >
              Delete
            </button>
            <button
              onClick={() => setSelected(new Set())}
              className="text-xs text-[var(--muted)] hover:underline"
            >
              clear
            </button>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-left text-xs uppercase text-[var(--muted)]">
                <th className="py-2 pr-2">
                  <input type="checkbox" checked={allOnPageSelected} onChange={toggleAllOnPage} />
                </th>
                <th className="py-2 pr-4">Headline</th>
                <th className="py-2 pr-4">Source</th>
                <th className="py-2 pr-4">Published</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((r) => (
                <tr key={r.id} className="border-b border-[var(--border)] align-top">
                  <td className="py-3 pr-2">
                    <input
                      type="checkbox"
                      checked={selected.has(r.id)}
                      onChange={() => toggleRow(r.id)}
                    />
                  </td>
                  <td className="py-3 pr-4">
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium hover:text-brand"
                    >
                      {r.title}
                    </a>
                    {r.imported_article_slug && (
                      <a
                        href={`/articles/${r.imported_article_slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="ml-2 text-xs text-emerald-600 hover:underline"
                      >
                        view post →
                      </a>
                    )}
                    <div className="mt-0.5">
                      {r.has_content ? (
                        <span className="text-xs font-medium text-emerald-600">✓ Full article</span>
                      ) : r.content_fetched ? (
                        <span className="text-xs text-amber-600">summary only (gated)</span>
                      ) : (
                        <span className="text-xs text-[var(--muted)]">
                          summary — full body on publish
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 pr-4">
                    <span className="rounded bg-gray-100 px-2 py-0.5 text-xs">{r.source_name}</span>
                    {r.category && (
                      <span className="ml-1 rounded bg-indigo-50 px-1.5 py-0.5 text-xs font-medium text-indigo-700">
                        {r.category}
                      </span>
                    )}
                  </td>
                  <td className="py-3 pr-4 whitespace-nowrap text-[var(--muted)]">
                    {r.published_at ? formatDate(r.published_at) : "—"}
                  </td>
                  <td className="py-3 pr-4">
                    <StatusPill item={r} />
                  </td>
                  <td className="py-3">
                    <div className="flex flex-wrap gap-1">
                      <button
                        onClick={() => setPreviewId(r.id)}
                        className="rounded border border-[var(--border)] px-2 py-1 text-xs hover:bg-gray-50"
                      >
                        Preview
                      </button>
                      {!r.has_content && (
                        <button
                          onClick={() => rowAction.mutate({ id: r.id, kind: "fetch" })}
                          disabled={rowAction.isPending}
                          className="rounded border border-[var(--border)] px-2 py-1 text-xs hover:bg-gray-50"
                        >
                          Fetch full
                        </button>
                      )}
                      {!r.is_imported && (
                        <button
                          onClick={() => rowAction.mutate({ id: r.id, kind: "publish" })}
                          className="rounded bg-brand px-2 py-1 text-xs font-semibold text-white hover:bg-brand-dark"
                        >
                          Publish
                        </button>
                      )}
                      {!r.is_imported && (
                        <button
                          onClick={() => rowAction.mutate({ id: r.id, kind: "draft" })}
                          className="rounded border border-[var(--border)] px-2 py-1 text-xs hover:bg-gray-50"
                        >
                          Draft
                        </button>
                      )}
                      <button
                        onClick={() =>
                          rowAction.mutate({ id: r.id, kind: r.is_hidden ? "unhide" : "hide" })
                        }
                        className="rounded border border-[var(--border)] px-2 py-1 text-xs hover:bg-gray-50"
                      >
                        {r.is_hidden ? "Unhide" : "Hide"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {itemsLoading && <p className="py-4 text-[var(--muted)]">Loading…</p>}
          {!itemsLoading && items.length === 0 && (
            <p className="py-4 text-[var(--muted)]">
              No items. Run an ingestion above to pull in headlines.
            </p>
          )}
        </div>

        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-end gap-2 text-sm">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className={btn}>
              Prev
            </button>
            <span className="text-[var(--muted)]">
              Page {page} / {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className={btn}
            >
              Next
            </button>
          </div>
        )}
      </Card>

      {/* ---------- Bulk moderation ---------- */}
      <Card title="Bulk moderation by source">
        <p className="mb-3 text-sm text-[var(--muted)]">
          Hide or restore every item from one source (records stay in the database).
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={modSource}
            onChange={(e) => setModSource(e.target.value)}
            className="rounded-md border border-[var(--border)] px-3 py-2 text-sm"
          >
            <option value="">Choose a source…</option>
            {sources.map((s) => (
              <option key={s.slug} value={s.slug}>
                {s.name} ({s.count})
              </option>
            ))}
          </select>
          <button
            disabled={!modSource || sourceMut.isPending}
            onClick={() => sourceMut.mutate({ kind: "hide", slug: modSource })}
            className={btn}
          >
            Hide all
          </button>
          <button
            disabled={!modSource || sourceMut.isPending}
            onClick={() => sourceMut.mutate({ kind: "unhide", slug: modSource })}
            className={btn}
          >
            Unhide all
          </button>
        </div>
      </Card>

      {/* ---------- Remove data ---------- */}
      <Card title="Remove ingested data" danger>
        <p className="mb-3 text-sm text-[var(--muted)]">
          Permanently delete aggregated items from the database. Editorial posts already imported
          are not affected.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={modSource}
            onChange={(e) => setModSource(e.target.value)}
            className="rounded-md border border-[var(--border)] px-3 py-2 text-sm"
          >
            <option value="">Choose a source…</option>
            {sources.map((s) => (
              <option key={s.slug} value={s.slug}>
                {s.name} ({s.count})
              </option>
            ))}
          </select>
          <button
            disabled={!modSource || sourceMut.isPending}
            onClick={() => {
              if (confirm(`Delete all ${modSource} items?`))
                sourceMut.mutate({ kind: "delete", slug: modSource });
            }}
            className={`${btn} text-rose-600`}
          >
            Delete source
          </button>
          <button
            disabled={deleteAll.isPending}
            onClick={() => {
              if (confirm("Delete ALL ingested items? This cannot be undone.")) deleteAll.mutate();
            }}
            className={`${btn} text-rose-600`}
          >
            Delete all ingested items
          </button>
          <button disabled={clearRuns.isPending} onClick={() => clearRuns.mutate()} className={btn}>
            Clear run history
          </button>
        </div>
      </Card>

      {/* ---------- Run history ---------- */}
      <Card title="Recent runs">
        {(runs?.results?.length ?? 0) === 0 ? (
          <p className="text-sm text-[var(--muted)]">No runs yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-left text-xs uppercase text-[var(--muted)]">
                  <th className="py-2 pr-4">When</th>
                  <th className="py-2 pr-4">Sources</th>
                  <th className="py-2 pr-4">New</th>
                  <th className="py-2 pr-4">Updated</th>
                  <th className="py-2 pr-4">Errors</th>
                  <th className="py-2">Mode</th>
                </tr>
              </thead>
              <tbody>
                {runs?.results?.map((r) => (
                  <tr key={r.id} className="border-b border-[var(--border)]">
                    <td className="py-2 pr-4 whitespace-nowrap">{formatDate(r.created_at)}</td>
                    <td className="py-2 pr-4 text-[var(--muted)]">{r.sources.length}</td>
                    <td className="py-2 pr-4">+{r.created_count}</td>
                    <td className="py-2 pr-4">~{r.updated_count}</td>
                    <td className={`py-2 pr-4 ${r.error_count ? "text-rose-600" : ""}`}>
                      {r.error_count}
                    </td>
                    <td className="py-2">{r.dry_run ? "dry-run" : "live"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ---------- Full-article preview modal ---------- */}
      {previewId !== null && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:p-8"
          onClick={() => setPreviewId(null)}
        >
          <div
            className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <h3 className="text-lg font-bold">{preview?.title ?? "Loading…"}</h3>
              <button
                onClick={() => setPreviewId(null)}
                className="shrink-0 text-2xl leading-none text-[var(--muted)] hover:text-black"
              >
                ×
              </button>
            </div>
            {preview && (
              <p className="mb-3 text-xs text-[var(--muted)]">
                {preview.source_name}
                {preview.author ? ` · ${preview.author}` : ""}
                {" · "}
                <a
                  href={preview.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-brand hover:underline"
                >
                  original ↗
                </a>
              </p>
            )}
            {previewLoading ? (
              <p className="text-[var(--muted)]">Loading…</p>
            ) : preview?.content ? (
              <div
                className="prose prose-sm max-h-[60vh] max-w-none overflow-y-auto"
                dangerouslySetInnerHTML={{ __html: preview.content }}
              />
            ) : (
              <div>
                <p className="mb-3 text-sm text-[var(--muted)]">
                  No full body fetched yet
                  {preview && !preview.has_content && preview.content_fetched
                    ? " (this source is membership-gated — summary only)."
                    : "."}
                </p>
                {preview && (
                  <p className="rounded bg-gray-50 p-3 text-sm">
                    {preview.summary || "No summary available."}
                  </p>
                )}
                {preview && !preview.content_fetched && (
                  <button
                    onClick={() =>
                      rowAction.mutate(
                        { id: preview.id, kind: "fetch" },
                        {
                          onSuccess: () =>
                            qc.invalidateQueries({ queryKey: ["agg-item", preview.id] }),
                        },
                      )
                    }
                    disabled={rowAction.isPending}
                    className={`${btnBrand} mt-3`}
                  >
                    {rowAction.isPending ? "Fetching…" : "Fetch full article"}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---------- Synthesis result / error modal ---------- */}
      {(synthResult || synthError) && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:p-8"
          onClick={() => {
            setSynthResult(null);
            setSynthError(null);
          }}
        >
          <div
            className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {synthError ? (
              <>
                <h3 className="mb-2 text-lg font-bold text-rose-600">Synthesis failed</h3>
                <p className="rounded bg-rose-50 p-3 text-sm text-rose-800">{synthError}</p>
                <p className="mt-3 text-xs text-[var(--muted)]">
                  Using Ollama? Make sure it is running on the server and the model has been pulled
                  (<code>ollama pull llama3.1:8b</code>). On a small VPS, switch to
                  <code> AI_PROVIDER=groq</code> with a free key instead.
                </p>
                <div className="mt-4 flex justify-end">
                  <button onClick={() => setSynthError(null)} className={btn}>
                    Close
                  </button>
                </div>
              </>
            ) : (
              synthResult && (
                <>
                  <h3 className="mb-2 text-lg font-bold text-emerald-700">✨ Draft created</h3>
                  <p className="text-sm font-semibold">{synthResult.article_title}</p>
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    {synthResult.provider} · {synthResult.model} ·{" "}
                    {(synthResult.duration_ms / 1000).toFixed(1)}s ·{" "}
                    {synthResult.completion_tokens} tokens · {synthResult.source_ids.length}{" "}
                    source(s)
                  </p>
                  <p className="mt-3 text-sm">
                    An <strong>original, cited draft</strong> was created from your selected sources
                    and saved to <strong>Articles</strong> as a draft. Review and edit it, then
                    publish — nothing goes live automatically.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <a href="/dashboard/articles" className={btnBrand}>
                      Go to Articles
                    </a>
                    <button
                      onClick={() => setSynthResult(null)}
                      className={btn}
                    >
                      Close
                    </button>
                  </div>
                </>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}
