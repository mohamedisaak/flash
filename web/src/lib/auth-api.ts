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

class AuthError extends Error {}

async function refreshAccessToken(): Promise<boolean> {
  const refresh = getRefreshToken();
  if (!refresh) return false;
  const res = await fetch(`${env.apiUrl}/auth/login/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });
  if (!res.ok) return false;
  const data = (await res.json()) as { access: string };
  setTokens(data.access);
  return true;
}

async function authFetch(path: string, init: RequestInit = {}, retry = true): Promise<Response> {
  const token = getAccessToken();
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${env.apiUrl}${path}`, { ...init, headers });

  if (res.status === 401 && retry) {
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

  async createArticle(payload: ArticleWritePayload): Promise<Article> {
    return json<Article>(await authFetch("/articles/", { method: "POST", body: JSON.stringify(payload) }));
  },

  async updateArticle(slug: string, payload: ArticleWritePayload): Promise<Article> {
    return json<Article>(await authFetch(`/articles/${slug}/`, { method: "PATCH", body: JSON.stringify(payload) }));
  },

  async listCategories(): Promise<Category[]> {
    const page = await json<Paginated<Category>>(await authFetch("/categories/"));
    return page.results;
  },
};

export { AuthError };
