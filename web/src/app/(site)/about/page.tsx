import type { Metadata } from "next";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-3xl font-extrabold">About Flash News</h1>
      <div className="article-body mt-4 text-[1.05rem] leading-relaxed text-[var(--foreground)]">
        <p>
          Flash News is a demo news publishing platform built as a full-stack learning
          project. It spans a Django REST API, an SEO layer, this Next.js website, and an
          editorial dashboard — all documented in the <code>teaching/</code> curriculum.
        </p>
        <p>
          This page is a placeholder for the sort of static content (About, Contact, Terms,
          Privacy) a real newsroom would manage from the admin panel.
        </p>
      </div>
    </div>
  );
}
