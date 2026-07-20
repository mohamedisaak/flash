"use client";
import { CrudSection } from "@/components/dashboard/crud/crud-section";
interface Row { id: number; name: string; icon: string; url: string; order: number; }
export default function SocialItemsPage() {
  return (
    <CrudSection<Row>
      title="Social Items" resourcePath="cms/social-items" queryKey="social-items"
      columns={[
        { header: "Name", render: (r) => r.name },
        { header: "Icon", render: (r) => <code className="text-xs">{r.icon}</code> },
        { header: "URL", render: (r) => <a href={r.url} className="text-brand hover:underline">{r.url}</a> },
      ]}
      fields={[
        { name: "name", label: "Name", type: "text", required: true },
        { name: "icon", label: "Icon Class", type: "text", required: true, help: "e.g. fab fa-facebook-f" },
        { name: "url", label: "URL", type: "url", required: true },
        { name: "order", label: "Order", type: "number" },
      ]}
      toForm={(r) => ({ name: r.name, icon: r.icon, url: r.url, order: r.order })}
    />
  );
}
