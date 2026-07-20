"use client";

import { AD_PLACEMENTS } from "@/lib/dashboard-types";
import { CrudSection } from "@/components/dashboard/crud/crud-section";
import { Badge } from "@/components/ui/badge";

interface Row {
  id: number; name: string; placement: string; target_url: string;
  is_active: boolean; impressions: number; clicks: number;
}

export default function AdsPage() {
  return (
    <CrudSection<Row>
      title="Advertisements"
      resourcePath="ads"
      queryKey="ads"
      hasFiles
      columns={[
        { header: "Name", render: (r) => r.name },
        { header: "Placement", render: (r) => <Badge>{r.placement}</Badge> },
        { header: "Impressions", render: (r) => r.impressions },
        { header: "Clicks", render: (r) => r.clicks },
        { header: "Active", render: (r) => (r.is_active ? "Yes" : "No") },
      ]}
      fields={[
        { name: "name", label: "Name", type: "text", required: true },
        { name: "placement", label: "Placement", type: "select", options: AD_PLACEMENTS, required: true },
        { name: "image", label: "Image", type: "file" },
        { name: "html", label: "HTML (if no image)", type: "textarea" },
        { name: "target_url", label: "Target URL", type: "url" },
        { name: "is_active", label: "Active", type: "checkbox" },
      ]}
      toForm={(r) => ({ name: r.name, placement: r.placement, target_url: r.target_url, is_active: r.is_active })}
    />
  );
}
