"use client";
import { CrudSection } from "@/components/dashboard/crud/crud-section";
interface Row {
  id: number;
  question: string;
  answer: string;
  order: number;
  is_active: boolean;
}
export default function FaqsPage() {
  return (
    <CrudSection<Row>
      title="FAQs"
      resourcePath="cms/faqs"
      queryKey="faqs"
      columns={[
        { header: "Question", render: (r) => r.question },
        { header: "Order", render: (r) => r.order },
        { header: "Active", render: (r) => (r.is_active ? "Yes" : "No") },
      ]}
      fields={[
        { name: "question", label: "FAQ Title", type: "text", required: true },
        { name: "answer", label: "Answer", type: "textarea", required: true },
        { name: "order", label: "Order", type: "number" },
        { name: "is_active", label: "Active", type: "checkbox" },
      ]}
      toForm={(r) => ({
        question: r.question,
        answer: r.answer,
        order: r.order,
        is_active: r.is_active,
      })}
    />
  );
}
