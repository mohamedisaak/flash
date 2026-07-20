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

/** Payload for creating/updating an article (write-side field names). */
export interface ArticleWritePayload {
  title: string;
  subtitle?: string;
  excerpt?: string;
  content: string;
  category_id: number;
  status: string;
  published_at?: string | null;
}
