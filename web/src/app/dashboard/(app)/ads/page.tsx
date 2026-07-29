"use client";

import {
  AD_EFFECTS,
  AD_IMAGE_FIT,
  AD_OVERLAY_POSITIONS,
  AD_PLACEMENTS,
} from "@/lib/dashboard-types";
import { CrudSection } from "@/components/dashboard/crud/crud-section";
import { Badge } from "@/components/ui/badge";

interface Row {
  id: number;
  name: string;
  placement: string;
  target_url: string;
  left_text: string;
  right_text: string;
  overlay_text: string;
  overlay_position: string;
  image_fit: string;
  effect: string;
  is_active: boolean;
  impressions: number;
  clicks: number;
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
        { header: "Effect", render: (r) => r.effect },
        { header: "Impressions", render: (r) => r.impressions },
        { header: "Clicks", render: (r) => r.clicks },
        { header: "Active", render: (r) => (r.is_active ? "Yes" : "No") },
      ]}
      fields={[
        { name: "name", label: "Name", type: "text", required: true },
        {
          name: "placement",
          label: "Placement",
          type: "select",
          options: AD_PLACEMENTS,
          required: true,
        },
        { name: "image", label: "Image", type: "file" },
        {
          name: "image_fit",
          label: "Image fit",
          type: "select",
          options: AD_IMAGE_FIT,
          help: "Contain shows the whole image; cover fills the slot and may crop top/bottom or sides.",
        },
        { name: "html", label: "HTML (if no image)", type: "textarea" },
        { name: "target_url", label: "Target URL", type: "url" },
        {
          name: "left_text",
          label: "Left text (banner side text)",
          type: "text",
          help: "Text beside a centered banner image. Takes priority over overlay text.",
        },
        { name: "right_text", label: "Right text (banner side text)", type: "text" },
        {
          name: "overlay_text",
          label: "Overlay text",
          type: "text",
          help: "Caption drawn on top of the image. Only used when no left/right text is set.",
        },
        {
          name: "overlay_position",
          label: "Overlay position",
          type: "select",
          options: AD_OVERLAY_POSITIONS,
        },
        { name: "effect", label: "Attention effect", type: "select", options: AD_EFFECTS },
        { name: "is_active", label: "Active", type: "checkbox" },
      ]}
      toForm={(r) => ({
        name: r.name,
        placement: r.placement,
        target_url: r.target_url,
        left_text: r.left_text,
        right_text: r.right_text,
        overlay_text: r.overlay_text,
        overlay_position: r.overlay_position,
        image_fit: r.image_fit,
        effect: r.effect,
        is_active: r.is_active,
      })}
    />
  );
}
