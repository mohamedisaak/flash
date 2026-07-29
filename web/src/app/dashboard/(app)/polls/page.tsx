"use client";
import { CrudSection } from "@/components/dashboard/crud/crud-section";
interface Row {
  id: number;
  question: string;
  yes_votes: number;
  no_votes: number;
  is_active: boolean;
}
export default function PollsPage() {
  return (
    <CrudSection<Row>
      title="Online Polls"
      resourcePath="cms/polls"
      queryKey="polls"
      columns={[
        { header: "Question", render: (r) => r.question },
        { header: "Yes Vote", render: (r) => r.yes_votes },
        { header: "No Vote", render: (r) => r.no_votes },
        { header: "Active", render: (r) => (r.is_active ? "Yes" : "No") },
      ]}
      fields={[
        { name: "question", label: "Question", type: "text", required: true },
        { name: "is_active", label: "Active", type: "checkbox" },
      ]}
      toForm={(r) => ({ question: r.question, is_active: r.is_active })}
    />
  );
}
