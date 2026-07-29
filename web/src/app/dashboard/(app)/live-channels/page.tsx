"use client";
import { CrudSection } from "@/components/dashboard/crud/crud-section";
interface Row {
  id: number;
  title: string;
  url: string;
  is_active: boolean;
  order: number;
}
export default function LiveChannelsPage() {
  return (
    <CrudSection<Row>
      title="Live Channels"
      resourcePath="cms/live-channels"
      queryKey="live-channels"
      hasFiles
      columns={[
        { header: "Title", render: (r) => r.title },
        {
          header: "URL",
          render: (r) => (
            <a href={r.url} className="text-brand hover:underline">
              {r.url}
            </a>
          ),
        },
        { header: "Active", render: (r) => (r.is_active ? "Yes" : "No") },
      ]}
      fields={[
        { name: "title", label: "Title", type: "text", required: true },
        { name: "url", label: "Embed/Stream URL", type: "url", required: true },
        { name: "thumbnail", label: "Thumbnail", type: "file" },
        { name: "is_active", label: "Active", type: "checkbox" },
        { name: "order", label: "Order", type: "number" },
      ]}
      toForm={(r) => ({ title: r.title, url: r.url, is_active: r.is_active, order: r.order })}
    />
  );
}
