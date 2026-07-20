import Link from "next/link";

/** Rendered for unmatched routes and when a page calls `notFound()`. */
export default function NotFound() {
  return (
    <div className="py-20 text-center">
      <h1 className="text-4xl font-extrabold">404</h1>
      <p className="mt-2 text-[var(--muted)]">That page could not be found.</p>
      <Link href="/" className="mt-4 inline-block text-brand underline">
        Back to the home page
      </Link>
    </div>
  );
}
