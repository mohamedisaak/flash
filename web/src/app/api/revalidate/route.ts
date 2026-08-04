/**
 * On-demand revalidation endpoint.
 *
 * The Django backend POSTs here when CMS content changes (see
 * `apps/common/revalidate.py`), so an admin edit clears the affected pages'
 * cache and shows on the site within ~1s instead of waiting out the ISR window.
 *
 * Auth is a shared secret in the `x-revalidate-secret` header, matched against
 * `REVALIDATE_SECRET` (a server-only env var — never exposed to the browser).
 * Body: `{ "tags": ["cms:faqs", ...] }`. The backend speaks in logical content
 * tags; this handler maps each to the route(s) to purge. We use
 * `revalidatePath` (stable single-arg API in Next 16, traditional cache model).
 */
import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";

// This route must never be cached.
export const dynamic = "force-dynamic";

/** Purge the route(s) affected by one logical content tag. */
function purge(tag: string): void {
  switch (tag) {
    case "cms:faqs":
      revalidatePath("/faq");
      break;
    case "cms:pages":
      // Dynamic route → purge every /pages/<key> (About, Contact, …).
      revalidatePath("/pages/[key]", "page");
      break;
    case "cms:settings":
      // Site settings feed the footer, which lives in the root layout and is
      // present on every page — so purge the whole tree.
      revalidatePath("/", "layout");
      break;
  }
}

export async function POST(req: NextRequest) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "revalidation not configured" }, { status: 503 });
  }
  if (req.headers.get("x-revalidate-secret") !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let tags: string[] = [];
  try {
    const body = (await req.json()) as { tags?: unknown };
    if (Array.isArray(body.tags)) {
      tags = body.tags.filter((t): t is string => typeof t === "string");
    }
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  for (const tag of tags) purge(tag);
  return NextResponse.json({ revalidated: true, tags, now: Date.now() });
}
