"use client";

/**
 * Authenticated API client for the dashboard.
 *
 * Every request attaches the JWT access token. If the API answers 401 (token
 * expired), we transparently try the refresh token once, store the new access
 * token, and retry — so the user isn't kicked out mid-session. If refresh fails,
 * we clear tokens and the caller redirects to login.
 *
 * See teaching/11-authentication/02-jwt-and-drf-permissions.md and
 * teaching/12-nextjs/07-dashboard-and-forms.md.
 */
import { env } from "./env";
import { clearTokens, getAccessToken, getRefreshToken, setTokens } from "./auth-store";
import type { ArticleWritePayload, User } from "./dashboard-types";
import type { Article, Category, Paginated } from "./types";

/** A *definitive* auth failure (invalid/expired session) — the user must re-login. */
class AuthError extends Error {}

// Abort a request that hangs, so a slow/unreachable backend fails fast and the
// caller can retry instead of the UI stalling indefinitely.
const REQUEST_TIMEOUT_MS = 12_000;

/**
 * Exchange the refresh token for a new access token.
 *
 * Returns true on success, false only on a *definitive* failure (the refresh
 * token itself is invalid/expired → 400/401). On a transient failure (network
 * error, 5xx, timeout) it THROWS instead — so the caller does NOT clear the
 * session and log the user out just because the backend was briefly slow.
 */
async function refreshAccessToken(): Promise<boolean> {
  const refresh = getRefreshToken();
  if (!refresh) return false;
  const res = await fetch(`${env.apiUrl}/auth/login/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (res.status === 400 || res.status === 401) return false; // refresh truly invalid
  if (!res.ok) throw new Error(`Refresh temporarily failed (${res.status})`); // transient
  // ROTATE_REFRESH_TOKENS is on server-side, so a new refresh token comes back
  // too — persist it, or the next refresh would reuse a stale one.
  const data = (await res.json()) as { access: string; refresh?: string };
  setTokens(data.access, data.refresh);
  return true;
}

async function authFetch(path: string, init: RequestInit = {}, retry = true): Promise<Response> {
  const token = getAccessToken();
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  // Only set a JSON content-type for JSON bodies. For FormData (file uploads)
  // the browser must set `multipart/form-data; boundary=…` itself — forcing
  // application/json here makes DRF try to JSON-parse the raw file bytes.
  if (init.body && !(init.body instanceof FormData) && !headers.has("Content-Type"))
    headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${env.apiUrl}${path}`, {
    ...init,
    headers,
    signal: init.signal ?? AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (res.status === 401 && retry) {
    // refreshAccessToken() throws on transient failures — we let that propagate
    // WITHOUT clearing tokens (the session may still be valid). Only a false
    // return (definitively invalid refresh) logs the user out.
    if (await refreshAccessToken()) return authFetch(path, init, false);
    clearTokens();
    throw new AuthError("Session expired");
  }
  return res;
}

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`API ${res.status}: ${detail.slice(0, 300)}`);
  }
  return (await res.json()) as T;
}

/** Build multipart form data for an article write that includes a file field. */
function articleFormData(payload: ArticleWritePayload, featuredImage: File): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(payload)) {
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) value.forEach((v) => fd.append(key, String(v)));
    else fd.append(key, String(value));
  }
  fd.append("featured_image", featuredImage);
  return fd;
}

export const authApi = {
  async login(username: string, password: string): Promise<void> {
    const res = await fetch(`${env.apiUrl}/auth/login/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) throw new Error("Invalid username or password.");
    const data = (await res.json()) as { access: string; refresh: string };
    setTokens(data.access, data.refresh);
  },

  async me(): Promise<User> {
    return json<User>(await authFetch("/auth/me/"));
  },

  async listArticles(params: Record<string, string | number> = {}): Promise<Paginated<Article>> {
    const qs = new URLSearchParams(
      Object.entries(params).map(([k, v]) => [k, String(v)]),
    ).toString();
    return json<Paginated<Article>>(await authFetch(`/articles/?${qs}`));
  },

  async getArticle(slug: string): Promise<Article> {
    return json<Article>(await authFetch(`/articles/${slug}/`));
  },

  async createArticle(payload: ArticleWritePayload, featuredImage?: File | null): Promise<Article> {
    const body = featuredImage
      ? articleFormData(payload, featuredImage)
      : JSON.stringify(payload);
    return json<Article>(await authFetch("/articles/", { method: "POST", body }));
  },

  async updateArticle(
    slug: string,
    payload: ArticleWritePayload,
    featuredImage?: File | null,
  ): Promise<Article> {
    const body = featuredImage
      ? articleFormData(payload, featuredImage)
      : JSON.stringify(payload);
    return json<Article>(await authFetch(`/articles/${slug}/`, { method: "PATCH", body }));
  },

  /** Upload an inline editor image → its absolute URL. */
  async uploadImage(file: File): Promise<{ url: string }> {
    const fd = new FormData();
    fd.append("file", file);
    return json<{ url: string }>(await authFetch("/media/uploads/", { method: "POST", body: fd }));
  },

  async deleteArticle(slug: string): Promise<void> {
    const res = await authFetch(`/articles/${slug}/`, { method: "DELETE" });
    // DELETE returns 204 No Content on success.
    if (!res.ok && res.status !== 204) {
      throw new Error(`Delete failed (${res.status})`);
    }
  },

  async listCategories(): Promise<Category[]> {
    const page = await json<Paginated<Category>>(
      await authFetch("/categories/", { method: "GET" }),
    );
    return page.results;
  },
};

/**
 * A generic CRUD helper for any DRF collection at `/<path>/`. Returns typed
 * list/get/create/update/remove functions so each admin section is a few lines.
 * `uploadCreate`/`uploadUpdate` send multipart/form-data for file fields.
 */
export function resource<T extends { id: number }>(path: string) {
  const base = `/${path}/`;
  return {
    async list(params: Record<string, string | number> = {}): Promise<T[]> {
      const qs = new URLSearchParams(
        Object.entries(params).map(([k, v]) => [k, String(v)]),
      ).toString();
      const page = await json<Paginated<T>>(await authFetch(`${base}?${qs}`, { method: "GET" }));
      return page.results;
    },
    async listPaged(params: Record<string, string | number> = {}): Promise<Paginated<T>> {
      const qs = new URLSearchParams(
        Object.entries(params).map(([k, v]) => [k, String(v)]),
      ).toString();
      return json<Paginated<T>>(await authFetch(`${base}?${qs}`, { method: "GET" }));
    },
    async get(id: number | string): Promise<T> {
      return json<T>(await authFetch(`${base}${id}/`, { method: "GET" }));
    },
    async create(payload: Record<string, unknown>): Promise<T> {
      return json<T>(await authFetch(base, { method: "POST", body: JSON.stringify(payload) }));
    },
    async update(id: number | string, payload: Record<string, unknown>): Promise<T> {
      return json<T>(
        await authFetch(`${base}${id}/`, { method: "PATCH", body: JSON.stringify(payload) }),
      );
    },
    async remove(id: number | string): Promise<void> {
      const res = await authFetch(`${base}${id}/`, { method: "DELETE" });
      if (!res.ok && res.status !== 204) throw new Error(`Delete failed (${res.status})`);
    },
    /** Multipart create — pass a FormData with file + text fields. */
    async uploadCreate(form: FormData): Promise<T> {
      return json<T>(await authFetch(base, { method: "POST", body: form }));
    },
    async uploadUpdate(id: number | string, form: FormData): Promise<T> {
      return json<T>(await authFetch(`${base}${id}/`, { method: "PATCH", body: form }));
    },
  };
}

/** Read/patch a singleton endpoint (e.g. site settings) that has no id. */
export function singleton<T>(path: string) {
  const base = `/${path}/`;
  return {
    async get(): Promise<T> {
      return json<T>(await authFetch(base, { method: "GET" }));
    },
    async update(payload: Record<string, unknown> | FormData): Promise<T> {
      const body = payload instanceof FormData ? payload : JSON.stringify(payload);
      return json<T>(await authFetch(base, { method: "PATCH", body }));
    },
  };
}

/** POST a bare action endpoint (e.g. send-email, vote). */
export async function postAction(path: string): Promise<unknown> {
  return json<unknown>(await authFetch(path, { method: "POST", body: "{}" }));
}

/**
 * Authenticated request returning parsed JSON — for endpoints that don't fit the
 * `resource()` CRUD shape (custom actions like ingestion run/bulk/stats). GET by
 * default; pass a JSON-serialisable `body` to POST/PATCH.
 */
export async function apiRequest<T>(
  path: string,
  init: { method?: string; body?: unknown } = {},
): Promise<T> {
  const method = init.method ?? "GET";
  const body =
    init.body === undefined
      ? undefined
      : init.body instanceof FormData
        ? init.body
        : JSON.stringify(init.body);
  return json<T>(await authFetch(path, { method, body }));
}

export { AuthError };
