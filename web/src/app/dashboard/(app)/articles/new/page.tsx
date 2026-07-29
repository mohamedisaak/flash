"use client";

/** Create a new article. */
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/auth-api";
import { formValuesToPayload } from "@/lib/article-mapping";
import { ArticleForm, type ArticleFormValues } from "@/components/dashboard/article-form";

export default function NewArticlePage() {
  const router = useRouter();
  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: authApi.listCategories,
  });

  const mutation = useMutation({
    mutationFn: (v: ArticleFormValues) => authApi.createArticle(formValuesToPayload(v)),
    onSuccess: () => router.push("/dashboard/articles"),
  });

  return (
    <div>
      <div className="mb-6 rounded-lg bg-white px-6 py-5 shadow-sm">
        <h1 className="text-2xl font-extrabold">Add Post</h1>
      </div>
      <div className="max-w-3xl rounded-lg bg-white p-6 shadow-sm">
        <ArticleForm
          categories={categories ?? []}
          defaultValues={{}}
          onSubmit={(v) => mutation.mutate(v)}
          submitting={mutation.isPending}
          serverError={mutation.error instanceof Error ? mutation.error.message : undefined}
          submitLabel="Create Post"
        />
      </div>
    </div>
  );
}
