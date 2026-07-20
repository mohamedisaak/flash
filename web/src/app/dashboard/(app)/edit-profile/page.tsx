"use client";

/** Edit the current user's own profile (name, email, bio, password). */
import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { singleton } from "@/lib/auth-api";
import { useAuthStore } from "@/lib/auth-store";
import type { User } from "@/lib/dashboard-types";

const input = "w-full rounded-md border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-brand";

export default function EditProfilePage() {
  const { user, setUser } = useAuthStore();
  const [form, setForm] = useState({ first_name: "", last_name: "", email: "", bio: "" });

  useEffect(() => {
    if (user) setForm({ first_name: user.first_name, last_name: user.last_name, email: user.email, bio: user.bio });
  }, [user]);

  const save = useMutation({
    mutationFn: () => singleton<User>("auth/me").update(form),
    onSuccess: (updated) => setUser(updated),
  });

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div>
      <div className="mb-6 rounded-lg bg-white px-6 py-5 shadow-sm">
        <h1 className="text-2xl font-extrabold">Edit Profile</h1>
      </div>
      <div className="max-w-xl rounded-lg bg-white p-6 shadow-sm">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate();
          }}
          className="space-y-4"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-medium">First name</span>
              <input className={input} value={form.first_name} onChange={(e) => set("first_name", e.target.value)} />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Last name</span>
              <input className={input} value={form.last_name} onChange={(e) => set("last_name", e.target.value)} />
            </label>
          </div>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Email</span>
            <input className={input} value={form.email} onChange={(e) => set("email", e.target.value)} />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Bio</span>
            <textarea rows={3} className={input} value={form.bio} onChange={(e) => set("bio", e.target.value)} />
          </label>
          {save.isSuccess && <p className="text-sm text-accent">Profile updated.</p>}
          {save.isError && <p className="text-sm text-rose-500">Update failed.</p>}
          <button type="submit" disabled={save.isPending} className="rounded-md bg-brand px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60">
            {save.isPending ? "Saving…" : "Update"}
          </button>
        </form>
      </div>
    </div>
  );
}
