"use client";

/**
 * Dashboard login card (NewsPortal "Admin Panel Login" style). Exchanges
 * username+password for JWTs, loads the user, then enters the dashboard.
 * Outside the (app) route group, so it isn't gated.
 */
import { useRouter } from "next/navigation";
import { useState } from "react";
import { authApi } from "@/lib/auth-api";
import { useAuthStore } from "@/lib/auth-store";

export default function LoginPage() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await authApi.login(username, password);
      setUser(await authApi.me());
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f4f6fb] px-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow">
        <h1 className="mb-6 text-center text-2xl font-extrabold text-brand">Admin Panel Login</h1>
        <form onSubmit={submit} className="space-y-4">
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            autoComplete="username"
            className="w-full rounded-md border border-[var(--border)] px-4 py-3 text-sm outline-none focus:border-brand"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoComplete="current-password"
            className="w-full rounded-md border border-[var(--border)] px-4 py-3 text-sm outline-none focus:border-brand"
          />
          {error && <p className="text-sm text-rose-500">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-md bg-brand py-3 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
          >
            {busy ? "Signing in…" : "Login"}
          </button>
          <p className="text-center text-sm text-brand">Forget Password?</p>
        </form>
      </div>
    </div>
  );
}
