# REST & Resources

**Topic:** API Design · **Level:** Beginner → Intermediate

## 1. The idea in one sentence

> REST models your system as **resources** (nouns) that you act on with HTTP
> **verbs** — so `/articles/` + `GET` reads articles, `+ POST` creates one.

## 2. Resources are nouns, not verbs

Good REST URLs name *things*, and let the HTTP method describe the *action*:

- ✅ `GET /api/v1/articles/` — not `/api/v1/getArticles/`
- ✅ `POST /api/v1/comments/` — not `/api/v1/createComment/`

Our resources: `articles`, `categories`, `tags`, `videos`, `galleries`,
`live-blogs`, `ads`, `comments`, `notifications`. Each is a collection with a
consistent set of operations.

## 3. Collections and members

| URL | Is a… |
|-----|-------|
| `/articles/` | collection (list, create) |
| `/articles/{slug}/` | member (one article) |
| `/articles/{slug}/view/` | action on a member |

We use human-friendly **slugs** as identifiers for public content
(`/articles/kenya-election-2027/`) via `lookup_field = "slug"`, and numeric ids
for internal objects.

## 4. List vs detail representations

A design habit worth internalizing: **list endpoints return a lighter object
than detail endpoints.** Our article list omits the huge `content` body; the
detail view includes it. This keeps feeds fast and cheap.

## 5. Actions that aren't plain CRUD

Some operations don't map to create/read/update/delete cleanly:

- `POST /articles/{slug}/view/` — register a view
- `POST /ads/{id}/click/` — record a click
- `POST /comments/{id}/report/` — flag a comment
- `POST /notifications/mark-all-read/` — bulk action

These are modelled as **sub-actions on a resource** (via DRF's `@action`), which
keeps them discoverable and RESTful rather than inventing random top-level verbs.

## 6. Consistency is the whole point

Because every resource behaves the same way (same verbs, same pagination, same
error shapes), a client that learns one resource already understands the rest.
That predictability *is* good API design.

## 7. Exercises

- **Beginner:** Rewrite these bad URLs RESTfully: `/api/deleteArticle?id=3`,
  `/api/fetchAllTags`.
- **Intermediate:** Which of our endpoints are "actions" rather than CRUD, and
  why couldn't they be plain CRUD?

## 8. Interview questions

- **Junior:** What is a "resource" in REST?
- **Mid:** Why prefer HTTP verbs over verbs-in-the-URL?
- **Senior:** When does strict REST break down, and what alternatives exist
  (RPC, GraphQL)?

← [API Design index](README.md)
