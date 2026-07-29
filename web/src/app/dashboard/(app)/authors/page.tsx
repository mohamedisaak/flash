"use client";

import Image from "next/image";
import { env } from "@/lib/env";
import { mediaUrl } from "@/lib/utils";
import { ROLE_OPTIONS, USER_STATUS_OPTIONS } from "@/lib/dashboard-types";
import { CrudSection } from "@/components/dashboard/crud/crud-section";

interface AuthorRow {
  id: number;
  username: string;
  email: string;
  full_name: string;
  first_name: string;
  last_name: string;
  role: string;
  status: string;
  avatar: string | null;
}

export default function AuthorsPage() {
  return (
    <CrudSection<AuthorRow>
      title="Authors"
      addLabel="+ Add"
      resourcePath="users"
      queryKey="users"
      hasFiles
      columns={[
        {
          header: "Photo",
          render: (r) => {
            const src = mediaUrl(r.avatar, env.backendOrigin);
            return src ? (
              <Image
                src={src}
                alt={r.full_name || r.username}
                width={44}
                height={44}
                className="h-11 w-11 rounded object-cover"
              />
            ) : (
              <span className="text-[var(--muted)]">—</span>
            );
          },
        },
        { header: "Name", render: (r) => r.full_name || r.username },
        { header: "Email", render: (r) => r.email },
        {
          header: "Role",
          render: (r) => <span className="capitalize">{r.role.replace(/_/g, " ")}</span>,
        },
      ]}
      fields={[
        { name: "username", label: "Username", type: "text", required: true },
        { name: "email", label: "Email", type: "email", required: true },
        { name: "first_name", label: "First name", type: "text" },
        { name: "last_name", label: "Last name", type: "text" },
        { name: "role", label: "Role", type: "select", options: ROLE_OPTIONS },
        { name: "status", label: "Status", type: "select", options: USER_STATUS_OPTIONS },
        { name: "avatar", label: "Photo", type: "file" },
        {
          name: "password",
          label: "Password",
          type: "password",
          createOnly: true,
          help: "Leave blank to auto-generate; set only when adding.",
        },
      ]}
      toForm={(r) => ({
        username: r.username,
        email: r.email,
        first_name: r.first_name,
        last_name: r.last_name,
        role: r.role,
        status: r.status,
      })}
    />
  );
}
