"use client";

/** Create a new article. */
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/auth-api";
import { formValuesToPayload } from "@/lib/article-mapping";
import { ArticleForm, type ArticleFormValues } from "@/components/dashboard/article-form";

export default function NewArticlePage() {
  const router = useRouter();
  const { data: categories } = useQuery({ queryKey: ["categories"], queryFn: authApi.listCategories });

  const mutation = useMutation({
    mutationFn: (v: ArticleFormValues) => authApi.createArticle(formValuesToPayload(v)),
    onSuccess: () => router.push("/dashboard/articles"),
  });

  return (
    <div className="max-w-2xl">
      <h1 className="mb-4 text-2xl font-extrabold">New article</h1>
      <ArticleForm
        categories={categories ?? []}
        defaultValues={{}}
        onSubmit={(v) => mutation.mutate(v)}
        submitting={mutation.isPending}
        serverError={mutation.error instanceof Error ? mutation.error.message : undefined}
        submitLabel="Create article"
      />
    </div>
  );
}
