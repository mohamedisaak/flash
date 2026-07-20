"use client";

/**
 * Footer newsletter signup. Posts the email to the public subscribe endpoint.
 * Client Component (it has state + submits). See
 * teaching/13-react/02-state-and-hooks.md.
 */
import { useState } from "react";
import { env } from "@/lib/env";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    try {
      const res = await fetch(`${env.apiUrl}/newsletter/subscribe/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setStatus(res.ok ? "done" : "error");
      if (res.ok) setEmail("");
    } catch {
      setStatus("error");
    }
  }

  if (status === "done") {
    return <p className="text-sm text-accent">Thanks! You&apos;re subscribed.</p>;
  }

  return (
    <form onSubmit={submit} className="space-y-2">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email Address"
        className="w-full rounded bg-white px-3 py-2 text-sm text-gray-800 outline-none"
      />
      <button
        type="submit"
        disabled={status === "sending"}
        className="w-full rounded bg-brand px-3 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
      >
        {status === "sending" ? "Subscribing…" : "Subscribe Now"}
      </button>
      {status === "error" && <p className="text-xs text-red-400">Something went wrong.</p>}
    </form>
  );
}
