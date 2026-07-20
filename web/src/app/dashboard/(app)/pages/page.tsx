"use client";
import { CrudSection } from "@/components/dashboard/crud/crud-section";
interface Row { id: number; key: string; key_display: string; title: string; content: string; is_active: boolean; }
export default function PagesPage() {
  return (
    <CrudSection<Row>
      title="Pages" resourcePath="cms/pages" queryKey="pages" canCreate={false} canDelete={false}
      columns={[
        { header: "Page", render: (r) => r.key_display },
        { header: "Title", render: (r) => r.title },
        { header: "Status", render: (r) => (r.is_active ? "Show" : "Hide") },
      ]}
      fields={[
        { name: "title", label: "Title", type: "text", required: true },
        { name: "content", label: "Detail", type: "textarea", required: true },
        { name: "is_active", label: "Status (show)", type: "checkbox" },
      ]}
      toForm={(r) => ({ title: r.title, content: r.content, is_active: r.is_active })}
    />
  );
}
