"use client";

/**
 * A config-driven CRUD section: a page header, a data table, and an add/edit
 * modal form — for any DRF collection. Most admin sections are a few lines of
 * field/column config on top of this. File fields switch the request to
 * multipart/form-data automatically. See
 * teaching/12-nextjs/07-dashboard-and-forms.md.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { resource } from "@/lib/auth-api";
import { Modal } from "./modal";
import type { Column, Field } from "./types";

export function CrudSection<T extends { id: number }>({
  title,
  addLabel = "+ Add",
  resourcePath,
  queryKey,
  columns,
  fields,
  listParams = {},
  hasFiles = false,
  toForm,
  canDelete = true,
  canCreate = true,
  idField = "id",
}: {
  title: string;
  addLabel?: string;
  resourcePath: string;
  queryKey: string;
  columns: Column<T>[];
  fields: Field[];
  listParams?: Record<string, string | number>;
  hasFiles?: boolean;
  toForm?: (row: T) => Record<string, unknown>;
  canDelete?: boolean;
  canCreate?: boolean;
  /** Which field the API uses as the URL lookup (default "id"; e.g. "slug"). */
  idField?: keyof T & string;
}) {
  const api = resource<T>(resourcePath);
  const qc = useQueryClient();
  const { data: rows = [], isPending } = useQuery({
    queryKey: [queryKey, listParams],
    queryFn: () => api.list(listParams),
  });

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [error, setError] = useState("");

  const emptyForm = () =>
    Object.fromEntries(fields.map((f) => [f.name, f.type === "checkbox" ? false : ""]));

  function openAdd() {
    setValues(emptyForm());
    setEditingId(null);
    setError("");
    setOpen(true);
  }
  function openEdit(row: T) {
    setValues({ ...emptyForm(), ...(toForm ? toForm(row) : row) });
    setEditingId(row[idField] as string | number);
    setError("");
    setOpen(true);
  }

  const save = useMutation({
    mutationFn: async () => {
      const editing = editingId !== null;
      if (hasFiles) {
        const fd = new FormData();
        for (const f of fields) {
          const v = values[f.name];
          if (f.createOnly && editing && !v) continue;
          if (f.type === "file") {
            if (v instanceof File) fd.append(f.name, v);
            continue;
          }
          if (f.type === "checkbox") fd.append(f.name, v ? "true" : "false");
          else if (v !== "" && v != null) fd.append(f.name, String(v));
        }
        return editingId !== null ? api.uploadUpdate(editingId, fd) : api.uploadCreate(fd);
      }
      const payload: Record<string, unknown> = {};
      for (const f of fields) {
        const v = values[f.name];
        if (f.type === "file") continue;
        if (f.createOnly && editing && !v) continue;
        if (f.type === "checkbox") payload[f.name] = !!v;
        else if (f.type === "number") payload[f.name] = v === "" ? 0 : Number(v);
        else payload[f.name] = v;
      }
      return editingId !== null ? api.update(editingId, payload) : api.create(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [queryKey] });
      setOpen(false);
    },
    onError: (e) => setError(e instanceof Error ? e.message : "Save failed."),
  });

  const del = useMutation({
    mutationFn: (id: string | number) => api.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [queryKey] }),
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between rounded-lg bg-white px-6 py-5 shadow-sm">
        <h1 className="text-2xl font-extrabold">{title}</h1>
        {canCreate && (
          <button onClick={openAdd} className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark">
            {addLabel}
          </button>
        )}
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
                  {columns.map((c) => (
                    <th key={c.header} className="py-2 pr-4">{c.header}</th>
                  ))}
                  <th className="py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={row.id} className="border-b border-[var(--border)] align-top">
                    <td className="py-3 pr-4 text-[var(--muted)]">{i + 1}</td>
                    {columns.map((c) => (
                      <td key={c.header} className={`py-3 pr-4 ${c.className ?? ""}`}>{c.render(row)}</td>
                    ))}
                    <td className="py-3">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(row)} className="rounded bg-brand px-3 py-1 text-xs font-semibold text-white hover:bg-brand-dark">
                          Edit
                        </button>
                        {canDelete && (
                          <button
                            onClick={() => {
                              if (confirm("Delete this item?")) del.mutate(row[idField] as string | number);
                            }}
                            className="rounded bg-rose-500 px-3 py-1 text-xs font-semibold text-white hover:bg-rose-600"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length === 0 && <p className="py-4 text-[var(--muted)]">No items yet.</p>}
          </div>
        )}
      </div>

      <Modal title={editingId !== null ? `Edit ${title}` : `Add ${title}`} open={open} onClose={() => setOpen(false)}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate();
          }}
          className="space-y-4"
        >
          {fields
            .filter((f) => !(f.createOnly && editingId !== null && false))
            .map((f) => (
              <FieldInput
                key={f.name}
                field={f}
                value={values[f.name]}
                onChange={(v) => setValues((prev) => ({ ...prev, [f.name]: v }))}
              />
            ))}
          {error && <p className="text-sm text-rose-500">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setOpen(false)} className="rounded-md border border-[var(--border)] px-4 py-2 text-sm">
              Cancel
            </button>
            <button type="submit" disabled={save.isPending} className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60">
              {save.isPending ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: Field;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const cls = "w-full rounded-md border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-brand";
  const common = { id: field.name, required: field.required && field.type !== "file" };

  return (
    <div>
      <label htmlFor={field.name} className="mb-1 block text-sm font-medium">
        {field.label}
      </label>
      {field.type === "textarea" ? (
        <textarea {...common} rows={4} className={cls} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} />
      ) : field.type === "select" ? (
        <select {...common} className={cls} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)}>
          <option value="">Select…</option>
          {field.options?.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      ) : field.type === "checkbox" ? (
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} /> Yes
        </label>
      ) : field.type === "file" ? (
        <input
          {...common}
          type="file"
          className="block w-full text-sm"
          onChange={(e) => onChange(e.target.files?.[0] ?? "")}
        />
      ) : field.type === "color" ? (
        <div className="flex items-center gap-2">
          <input type="color" value={String(value || "#000000")} onChange={(e) => onChange(e.target.value)} />
          <input {...common} className={cls} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} />
        </div>
      ) : (
        <input
          {...common}
          type={field.type === "number" ? "number" : field.type === "url" ? "url" : field.type === "email" ? "email" : field.type === "password" ? "password" : field.type === "datetime" ? "datetime-local" : "text"}
          className={cls}
          placeholder={field.placeholder}
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
      {field.help && <p className="mt-1 text-xs text-[var(--muted)]">{field.help}</p>}
    </div>
  );
}
