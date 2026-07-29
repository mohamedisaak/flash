"use client";
import { CrudSection } from "@/components/dashboard/crud/crud-section";
interface Row {
  id: number;
  name: string;
  code: string;
  is_default: boolean;
}
export default function LanguagesPage() {
  return (
    <CrudSection<Row>
      title="Languages"
      resourcePath="cms/languages"
      queryKey="languages"
      columns={[
        { header: "Name", render: (r) => r.name },
        { header: "Short Name", render: (r) => r.code },
        { header: "Is Default?", render: (r) => (r.is_default ? "Yes" : "No") },
      ]}
      fields={[
        { name: "name", label: "Name", type: "text", required: true },
        { name: "code", label: "Short Name", type: "text", required: true, help: "e.g. en, bn" },
        { name: "is_default", label: "Is Default?", type: "checkbox" },
      ]}
      toForm={(r) => ({ name: r.name, code: r.code, is_default: r.is_default })}
    />
  );
}
