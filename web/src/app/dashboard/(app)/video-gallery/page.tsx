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
  views: number;
}

export default function VideoGalleryAdminPage() {
  const categoryOptions = useCategoryOptions();
  return (
    <CrudSection<Row>
      title="Videos"
      resourcePath="videos"
      queryKey="videos-admin"
      idField="slug"
      hasFiles
      columns={[
        { header: "Title", render: (r) => r.title },
        { header: "Category", render: (r) => r.category?.name ?? "—" },
        { header: "Views", render: (r) => r.views },
      ]}
      fields={[
        { name: "title", label: "Title", type: "text", required: true },
        {
          name: "video_file",
          label: "Video File",
          type: "file",
          help: "Required when adding a video.",
        },
        { name: "thumbnail", label: "Thumbnail", type: "file" },
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
