"use client";

/**
 * Authentication state, managed with Zustand.
 *
 * Zustand is a tiny state-management library: `create` returns a hook that any
 * component can call to read state or actions. Unlike React Context, there's no
 * provider to wrap the tree and no re-render of the whole subtree on change.
 *
 * We persist the JWT tokens in localStorage so a refresh keeps you logged in.
 * (Storing JWTs in localStorage is simple but XSS-exposed; a hardened setup
 * would use httpOnly cookies — noted in teaching/31-security/.)
 *
 * See teaching/18-zustand/01-what-is-zustand.md.
 */
import { create } from "zustand";
import type { User } from "./dashboard-types";

const ACCESS_KEY = "flash_access";
const REFRESH_KEY = "flash_refresh";
const USER_KEY = "flash_user";

interface AuthState {
  user: User | null;
  status: "loading" | "authenticated" | "anonymous";
  setUser: (user: User | null) => void;
  setStatus: (status: AuthState["status"]) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  status: "loading",
  setUser: (user) => {
    // Cache the user so a page refresh can render the dashboard immediately from
    // localStorage while /auth/me revalidates — instead of flashing to login.
    if (typeof window !== "undefined") {
      if (user) window.localStorage.setItem(USER_KEY, JSON.stringify(user));
      else window.localStorage.removeItem(USER_KEY);
    }
    set({ user, status: user ? "authenticated" : "anonymous" });
  },
  setStatus: (status) => set({ status }),
  logout: () => {
    clearTokens();
    set({ user: null, status: "anonymous" });
  },
}));

/** The last-known user, cached in localStorage for instant hydrate on refresh. */
export function getStoredUser(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

// --- token helpers (localStorage is browser-only; guard for SSR) ---
export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(REFRESH_KEY);
}

export function setTokens(access: string, refresh?: string): void {
  window.localStorage.setItem(ACCESS_KEY, access);
  if (refresh) window.localStorage.setItem(REFRESH_KEY, refresh);
}

export function clearTokens(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(ACCESS_KEY);
  window.localStorage.removeItem(REFRESH_KEY);
  window.localStorage.removeItem(USER_KEY);
}
