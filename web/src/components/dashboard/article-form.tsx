"use client";

/**
 * Create/edit article form.
 *
 * Uses **react-hook-form** for state + **Zod** for validation (via
 * `zodResolver`). Zod defines the rules once; RHF wires them to the inputs and
 * surfaces per-field errors. The Tiptap editor's HTML is stored in a
 * manually-registered `content` field. See
 * teaching/12-nextjs/07-dashboard-and-forms.md.
 */
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { Category } from "@/lib/types";
import { ARTICLE_STATUSES } from "@/lib/dashboard-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, Select, Textarea } from "@/components/ui/field";
import { TiptapEditor } from "./tiptap-editor";

const schema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters."),
  subtitle: z.string().optional(),
  excerpt: z.string().optional(),
  content: z.string().min(1, "Please write some content."),
  category_id: z.coerce.number().int().positive("Choose a category."),
  status: z.string(),
  // datetime-local string; validated further at submit for scheduled posts.
  published_at: z.string().optional(),
  image_caption: z.string().optional(),
  featured_image_url: z.string().optional(),
});

export type ArticleFormValues = z.infer<typeof schema>;

export function ArticleForm({
  categories,
  defaultValues,
  defaultFeaturedImage,
  onSubmit,
  submitting,
  serverError,
  submitLabel = "Save",
}: {
  categories: Category[];
  defaultValues: Partial<ArticleFormValues>;
  defaultFeaturedImage?: string | null;
  onSubmit: (values: ArticleFormValues, featuredImage: File | null) => void;
  submitting: boolean;
  serverError?: string;
  submitLabel?: string;
}) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ArticleFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { status: "draft", content: "", ...defaultValues },
  });

  // Featured (lead) image — either an external URL (preferred; saves disk) or an
  // uploaded File. They're mutually exclusive: choosing one clears the other.
  const [featuredFile, setFeaturedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const urlValue = (watch("featured_image_url") ?? "").trim();
  const shownImage = filePreview || urlValue || defaultFeaturedImage || null;
  const onPickImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setFeaturedFile(file);
    setFilePreview(file ? URL.createObjectURL(file) : null);
    if (file) setValue("featured_image_url", ""); // an upload replaces any URL
  };

  // Tiptap sets `content` imperatively, so register it manually.
  register("content");
  const content = watch("content") ?? "";
  const status = watch("status");
  const needsSchedule = status === "scheduled" || status === "published";

  return (
    <form
      onSubmit={handleSubmit((values) => onSubmit(values, featuredFile))}
      className="space-y-5"
    >
      <Field label="Title" htmlFor="title" error={errors.title?.message}>
        <Input id="title" {...register("title")} />
      </Field>

      <Field label="Subtitle" htmlFor="subtitle">
        <Input id="subtitle" {...register("subtitle")} />
      </Field>

      <Field label="Excerpt (summary)" htmlFor="excerpt">
        <Textarea id="excerpt" rows={2} {...register("excerpt")} />
      </Field>

      <Field label="Featured image">
        <div className="flex items-start gap-4">
          {shownImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={shownImage}
              alt="Featured preview"
              className="h-24 w-40 shrink-0 rounded-md border border-[var(--border)] object-cover"
            />
          ) : (
            <div className="flex h-24 w-40 shrink-0 items-center justify-center rounded-md border border-dashed border-[var(--border)] text-xs text-[var(--muted)]">
              No image
            </div>
          )}
          <div className="flex-1 space-y-2">
            <Input
              placeholder="Paste an image URL (recommended — saves disk)…"
              {...register("featured_image_url", {
                onChange: () => {
                  setFeaturedFile(null);
                  setFilePreview(null);
                },
              })}
            />
            <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
              <span>or upload a file:</span>
              <input type="file" accept="image/*" onChange={onPickImage} className="text-sm" />
            </div>
            <p className="text-xs text-[var(--muted)]">
              Reference an online image URL (no server storage used) or upload one rarely. Add images
              &amp; video inside the article with the 🖼 / 🎬 buttons in the editor below.
            </p>
          </div>
        </div>
      </Field>

      <Field label="Image caption" htmlFor="image_caption">
        <Input id="image_caption" {...register("image_caption")} />
      </Field>

      <Field label="Content" error={errors.content?.message}>
        <TiptapEditor
          value={content}
          onChange={(html) => setValue("content", html, { shouldValidate: true })}
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Category" htmlFor="category_id" error={errors.category_id?.message}>
          <Select id="category_id" {...register("category_id")} defaultValue="">
            <option value="" disabled>
              Choose…
            </option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Status" htmlFor="status">
          <Select id="status" {...register("status")}>
            {ARTICLE_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      {needsSchedule && (
        <Field
          label={status === "scheduled" ? "Publish at (future)" : "Publish date"}
          htmlFor="published_at"
        >
          <Input id="published_at" type="datetime-local" {...register("published_at")} />
        </Field>
      )}

      {serverError && <p className="text-sm text-brand">{serverError}</p>}

      <div className="flex gap-3">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
