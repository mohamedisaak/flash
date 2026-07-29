# The Dashboard: Auth, Protected Routes & Forms

**Topic:** Next.js · **Level:** Intermediate → Advanced
**Prerequisites:** [`03-server-vs-client-components.md`](03-server-vs-client-components.md),
[`../11-authentication/02-jwt-and-drf-permissions.md`](../11-authentication/02-jwt-and-drf-permissions.md)

The editorial/admin + author dashboard (Phase 5b) is an **authenticated,
interactive** app area — the opposite of the public site's server-rendered,
cached pages. This lesson ties together auth, protected routes, and forms.

## 1. Authenticated data fetching

The public site fetches on the server. The dashboard fetches in the **browser**,
attaching a JWT. [`web/src/lib/auth-api.ts`](../../web/src/lib/auth-api.ts) wraps
`fetch` to:

1. attach `Authorization: Bearer <access token>`,
2. on a `401`, transparently use the **refresh token** once and retry,
3. if refresh fails, clear tokens so the app redirects to login.

That auto-refresh is why a user isn't kicked out when their short-lived access
token expires mid-session.

## 2. Session state with Zustand

The logged-in user lives in a Zustand store
([`auth-store.ts`](../../web/src/lib/auth-store.ts)); tokens live in
`localStorage`. See [`../18-zustand/`](../18-zustand/README.md).

> Security note: localStorage JWTs are simple but exposed to XSS. A hardened
> build uses httpOnly cookies. Tracked for [`../31-security/`](../31-security/README.md).

## 3. Protected routes with route groups

We split the dashboard so the login page isn't gated:

```text
app/dashboard/
├── layout.tsx          # noindex for the whole area
├── login/page.tsx      # NOT gated
└── (app)/              # route group — no URL segment
    ├── layout.tsx      # wraps children in <DashboardShell> (the gate)
    ├── page.tsx        # /dashboard
    └── articles/...    # /dashboard/articles, /new, /[slug]/edit
```

The `(app)` folder is a **route group**: parentheses mean "group these files
without adding a URL segment." So `(app)/page.tsx` is `/dashboard`, and the login
page sits outside the group — no redirect loop.

[`DashboardShell`](../../web/src/components/dashboard/dashboard-shell.tsx) is the
gate: on mount it loads `/auth/me`; if there's no valid session it redirects to
`/dashboard/login`; otherwise it renders the sidebar + page. The nav is also
**role-gated** — non-publishers see a note that they can submit but not publish.

## 4. Forms: React Hook Form + Zod

[`article-form.tsx`](../../web/src/components/dashboard/article-form.tsx) uses
**react-hook-form** for input state and **Zod** for validation:

```tsx
const schema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters."),
  content: z.string().min(1, "Please write some content."),
  category_id: z.coerce.number().int().positive("Choose a category."),
  ...
});
const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) });
```

- **Zod** declares the rules *and* infers the TypeScript type
  (`z.infer<typeof schema>`) — one source of truth for validation and types.
- **`zodResolver`** connects them; RHF then shows per-field errors and blocks
  submit until valid.
- `z.coerce.number()` turns the `<select>`'s string value into a number.

## 5. The rich-text editor (Tiptap)

The article body is edited with **Tiptap**
([`tiptap-editor.tsx`](../../web/src/components/dashboard/tiptap-editor.tsx)),
which outputs HTML we store in `content`. Two gotchas:

- `immediatelyRender: false` prevents an SSR hydration mismatch (it's
  browser-only).
- Tiptap sets `content` imperatively, so we `register("content")` manually and
  push updates with `setValue("content", html)`.

## 6. Mutations with TanStack Query

Create/edit use `useMutation`:

```tsx
const mutation = useMutation({
  mutationFn: (v) => authApi.createArticle(formValuesToPayload(v)),
  onSuccess: () => router.push("/dashboard/articles"),
});
```

`formValuesToPayload` ([`article-mapping.ts`](../../web/src/lib/article-mapping.ts))
converts the form's `datetime-local` value into an ISO timestamp and applies the
"published needs a date" rule — the same scheduling logic the backend's
`publish_scheduled_articles` task relies on.

## 7. Defense in depth (recap)

The frontend gate is **UX, not security** — it hides UI. Real enforcement is on
the backend (JWT auth + RBAC permission classes + queryset scoping from Phases 2).
Never trust the client; the API rejects an author trying to publish regardless of
what the dashboard shows.

## 7b. Gotcha: never hand-set `Content-Type` for `FormData`

Our `authFetch` helper defaults a JSON content-type for any request that has a
body:

```ts
// BROKEN — clobbers file uploads
if (init.body && !headers.has("Content-Type"))
  headers.set("Content-Type", "application/json");
```

For text endpoints that's fine. But an image upload sends a `FormData` body, and
`FormData` is *also* truthy — so this line stamped `application/json` onto a
multipart request. Two things then go wrong:

1. The browser **stops** adding its own `Content-Type: multipart/form-data;
   boundary=…` header. Without the boundary, no server can split the parts.
2. DRF believes the claim and routes the body to its **JSON** parser. The first
   byte of a JPEG is `0xFF`, which is not valid UTF-8, so you get:

   ```
   API 400: JSON parse error - 'utf-8' codec can't decode byte 0xff in position 334: invalid start byte
   ```

The rule: **let the browser set the content-type for `FormData`.** Only force
JSON when the body is *not* a `FormData`.

```ts
// FIXED
if (init.body && !(init.body instanceof FormData) && !headers.has("Content-Type"))
  headers.set("Content-Type", "application/json");
```

Because every request (JSON create, multipart `uploadCreate`, singleton file
patch) funnels through this one helper, the one-line guard fixes all upload
paths at once — a good argument for a single choke-point client over scattered
`fetch` calls.

## 8. Exercises

- **Beginner:** Add a "Preview" link on the edit page that opens the public
  article in a new tab.
- **Intermediate:** Add a delete button (DELETE `/articles/{slug}/`) with a
  confirm, invalidating the list query on success.
- **Advanced:** Move token storage to httpOnly cookies and adjust the auth flow;
  discuss the XSS/CSRF trade-offs.

## 9. Interview questions

- **Junior:** Why is the dashboard client-rendered while article pages are
  server-rendered?
- **Mid:** How do route groups let you gate some routes but not others?
- **Senior:** Why is a client-side auth gate not a security boundary, and where
  is the real one?

← [Next.js topic index](README.md)
