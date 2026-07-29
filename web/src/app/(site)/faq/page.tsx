/**
 * FAQ page — renders the question/answer entries editors manage in the
 * dashboard's "FAQ Section". Updates here on ISR (5-min revalidate).
 */
import type { Metadata } from "next";
import { api } from "@/lib/api";
import { env } from "@/lib/env";
import { JsonLd } from "@/components/json-ld";
import { buildFaqJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Answers to frequently asked questions about our newsroom and coverage.",
  alternates: { canonical: `${env.siteUrl}/faq` },
};
export const revalidate = 300;

export default async function FaqPage() {
  const faqs = await api.listFaqs();
  const faqJsonLd = buildFaqJsonLd(faqs.map((f) => ({ question: f.question, answer: f.answer })));

  return (
    <div className="mx-auto max-w-3xl">
      <JsonLd data={faqJsonLd} />
      <h1 className="text-3xl font-extrabold">Frequently Asked Questions</h1>
      {faqs.length === 0 ? (
        <p className="mt-4 text-[var(--muted)]">No questions have been published yet.</p>
      ) : (
        <div className="mt-6 divide-y divide-[var(--border)]">
          {faqs.map((f) => (
            <details key={f.id} className="group py-4" open>
              <summary className="cursor-pointer list-none text-lg font-bold marker:hidden">
                <span className="text-brand">Q.</span> {f.question}
              </summary>
              <p className="mt-2 whitespace-pre-line leading-relaxed text-[var(--foreground)]">
                {f.answer}
              </p>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}
