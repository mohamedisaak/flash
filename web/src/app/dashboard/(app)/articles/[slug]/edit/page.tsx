"use client";

/**
 * Edit an existing article.
 *
 * In a Client Component, route `params` is a Promise you unwrap with React's
 * `use()` hook. We load the article + categories, prefill the form, and PATCH on
 * save. See teaching/12-nextjs/07-dashboard-and-forms.md.
 */
import { use } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/auth-api";
import { formValuesToPayload, isoToLocalInput } from "@/lib/article-mapping";
import { ArticleForm, type ArticleFormValues } from "@/components/dashboard/article-form";

export default function EditArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();

  const { data: article, isPending } = useQuery({
    queryKey: ["article", slug],
    queryFn: () => authApi.getArticle(slug),
  });
  const { data: categories } = useQuery({ queryKey: ["categories"], queryFn: authApi.listCategories });

  const mutation = useMutation({
    mutationFn: (v: ArticleFormValues) => authApi.updateArticle(slug, formValuesToPayload(v)),
    onSuccess: () => router.push("/dashboard/articles"),
  });

  if (isPending || !article) return <p className="text-[var(--muted)]">Loading article…</p>;

  return (
    <div className="max-w-2xl">
      <h1 className="mb-4 text-2xl font-extrabold">Edit article</h1>
      <ArticleForm
        categories={categories ?? []}
        defaultValues={{
          title: article.title,
          subtitle: article.subtitle,
          excerpt: article.excerpt,
          content: article.content,
          category_id: article.category.id,
          status: article.status,
          published_at: isoToLocalInput(article.published_at),
        }}
        onSubmit={(v) => mutation.mutate(v)}
        submitting={mutation.isPending}
        serverError={mutation.error instanceof Error ? mutation.error.message : undefined}
        submitLabel="Save changes"
      />
    </div>
  );
}
