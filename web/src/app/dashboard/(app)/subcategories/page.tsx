"use client";

import { CrudSection } from "@/components/dashboard/crud/crud-section";
import { useCategoryOptions } from "@/components/dashboard/use-category-options";

interface CatRow {
  id: number;
  name: string;
  slug: string;
  parent: number | null;
  order: number;
}

export default function SubCategoriesPage() {
  const parentOptions = useCategoryOptions({ topOnly: true });
  return (
    <CrudSection<CatRow>
      title="SubCategories"
      resourcePath="categories"
      queryKey="subcategories-admin"
      idField="slug"
      listParams={{ page_size: 100, level: "sub" }}
      columns={[
        { header: "SubCategory Name", render: (r) => r.name },
        { header: "Slug", render: (r) => r.slug },
        { header: "Order", render: (r) => r.order },
      ]}
      fields={[
        { name: "name", label: "SubCategory Name", type: "text", required: true },
        {
          name: "parent",
          label: "Parent Category",
          type: "select",
          options: parentOptions,
          required: true,
        },
        { name: "order", label: "Order", type: "number" },
      ]}
      toForm={(r) => ({ name: r.name, parent: r.parent ?? "", order: r.order })}
    />
  );
}
