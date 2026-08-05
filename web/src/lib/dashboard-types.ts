/**
 * Types specific to the authenticated dashboard (users, write payloads).
 * Public content types live in ./types.ts.
 */

export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  first_name: string;
  last_name: string;
  role: string;
  status: string;
  avatar: string | null;
  bio: string;
}

/** Roles allowed to publish (mirrors User.can_publish on the backend). */
export const PUBLISHER_ROLES = [
  "super_admin",
  "admin",
  "editor_in_chief",
  "managing_editor",
  "section_editor",
];

export function canPublish(role: string): boolean {
  return PUBLISHER_ROLES.includes(role);
}

/** The article statuses an editor can choose in the form. */
export const ARTICLE_STATUSES = [
  { value: "draft", label: "Draft" },
  { value: "review", label: "In review" },
  { value: "scheduled", label: "Scheduled" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
] as const;

export const ROLE_OPTIONS = [
  { value: "super_admin", label: "Super Admin" },
  { value: "admin", label: "Admin" },
  { value: "editor_in_chief", label: "Editor in Chief" },
  { value: "managing_editor", label: "Managing Editor" },
  { value: "section_editor", label: "Section Editor" },
  { value: "journalist", label: "Journalist" },
  { value: "author", label: "Author" },
  { value: "photographer", label: "Photographer" },
  { value: "video_editor", label: "Video Editor" },
  { value: "moderator", label: "Moderator" },
  { value: "subscriber", label: "Subscriber" },
];

export const USER_STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "pending", label: "Pending" },
  { value: "suspended", label: "Suspended" },
  { value: "banned", label: "Banned" },
];

export const AD_PLACEMENTS = [
  { value: "header", label: "Header" },
  { value: "sidebar", label: "Sidebar" },
  { value: "in_content", label: "In-content" },
  { value: "mobile", label: "Mobile" },
  { value: "popup", label: "Popup" },
];

export const AD_OVERLAY_POSITIONS = [
  { value: "bottom", label: "Bottom" },
  { value: "center", label: "Center" },
  { value: "top", label: "Top" },
];

export const AD_IMAGE_FIT = [
  { value: "contain", label: "Contain (whole image)" },
  { value: "cover", label: "Cover (fill, may crop)" },
];

export const AD_EFFECTS = [
  { value: "none", label: "None" },
  { value: "pulse", label: "Pulse (gentle)" },
  { value: "glow", label: "Glow" },
  { value: "blink", label: "Blink" },
];

/** Payload for creating/updating an article (write-side field names). */
export interface ArticleWritePayload {
  title: string;
  subtitle?: string;
  excerpt?: string;
  content: string;
  category_id: number;
  status: string;
  published_at?: string | null;
  image_caption?: string;
}
