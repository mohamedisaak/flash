"use client";

import { CrudSection } from "@/components/dashboard/crud/crud-section";

interface CatRow {
  id: number;
  name: string;
  slug: string;
  parent: number | null;
  order: number;
  is_active: boolean;
}

export default function CategoriesPage() {
  return (
    <CrudSection<CatRow>
      title="Categories"
      resourcePath="categories"
      queryKey="categories-admin"
      idField="slug"
      listParams={{ page_size: 100, level: "top" }}
      columns={[
        { header: "Category Name", render: (r) => r.name },
        { header: "Slug", render: (r) => r.slug },
        { header: "Order", render: (r) => r.order },
        { header: "Active", render: (r) => (r.is_active ? "Yes" : "No") },
      ]}
      fields={[
        { name: "name", label: "Category Name", type: "text", required: true },
        { name: "order", label: "Category Order", type: "number" },
        { name: "is_active", label: "Active", type: "checkbox" },
      ]}
      toForm={(r) => ({ name: r.name, order: r.order, is_active: r.is_active })}
    />
  );
}
