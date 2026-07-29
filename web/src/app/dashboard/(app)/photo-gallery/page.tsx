"use client";

import { CrudSection } from "@/components/dashboard/crud/crud-section";
import { useCategoryOptions } from "@/components/dashboard/use-category-options";
import type { Category } from "@/lib/types";

interface Row {
  id: number;
  title: string;
  slug: string;
  description: string;
  category: Category;
  images: unknown[];
  published_at: string | null;
}

export default function PhotoGalleryAdminPage() {
  const categoryOptions = useCategoryOptions();
  return (
    <CrudSection<Row>
      title="Photo Galleries"
      resourcePath="galleries"
      queryKey="galleries-admin"
      idField="slug"
      columns={[
        { header: "Title", render: (r) => r.title },
        { header: "Category", render: (r) => r.category?.name ?? "—" },
        { header: "Photos", render: (r) => r.images?.length ?? 0 },
      ]}
      fields={[
        { name: "title", label: "Title", type: "text", required: true },
        {
          name: "category_id",
          label: "Category",
          type: "select",
          options: categoryOptions,
          required: true,
        },
        { name: "description", label: "Description", type: "textarea" },
      ]}
      toForm={(r) => ({
        title: r.title,
        category_id: r.category?.id ?? "",
        description: r.description,
      })}
    />
  );
}
