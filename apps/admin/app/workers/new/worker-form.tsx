"use client";

import { useActionState, useState } from "react";
import type { AdminSiteRow } from "@/lib/db";
import { createWorker } from "./actions";

type State = { error?: string } | null;

function generatePassword(): string {
  // 12 chars, mix of letters + digits, no easily-confused chars (0/O, 1/l/I)
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  const len = 12;
  if (typeof window !== "undefined" && window.crypto) {
    const buf = new Uint32Array(len);
    window.crypto.getRandomValues(buf);
    return Array.from(buf, (n) => alphabet[n % alphabet.length]).join("");
  }
  let out = "";
  for (let i = 0; i < len; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}

export function WorkerForm({
  sites,
  defaultSiteId,
}: {
  sites: AdminSiteRow[];
  defaultSiteId?: string;
}) {
  const [state, formAction, pending] = useActionState<State, FormData>(createWorker, null);
  const [password, setPassword] = useState<string>("EwmTest2026!");
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={formAction} className="mt-6 space-y-6 rounded-lg border border-slate-200 bg-white p-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Full name *</label>
          <input
            type="text"
            name="full_name"
            required
            placeholder="e.g. Maria Hernandez"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Email *</label>
          <input
            type="email"
            name="email"
            required
            placeholder="maria@example.com"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div>
        <div className="mb-1 flex items-end justify-between">
          <label className="text-sm font-medium text-slate-700">Initial password *</label>
          <div className="flex gap-3 text-xs">
            <button
              type="button"
              onClick={() => setPassword(generatePassword())}
              className="font-medium text-[#5EB4CC] hover:underline"
            >
              Generate
            </button>
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="font-medium text-slate-500 hover:text-slate-900"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>
        <input
          type={showPassword ? "text" : "password"}
          name="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 font-mono text-sm"
        />
        <p className="mt-1 text-xs text-slate-500">
          Share with the worker. They can change it after their first sign-in.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Language *</label>
          <select
            name="preferred_language"
            defaultValue="en"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="en">English</option>
            <option value="es">Español</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Role *</label>
          <select
            name="role"
            defaultValue="worker"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="worker">Worker (field)</option>
            <option value="site_manager">Site manager</option>
            <option value="area_manager">Area manager</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Site *</label>
          {sites.length === 0 ? (
            <p className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800">
              No sites yet — create one first.
            </p>
          ) : (
            <select
              name="site_id"
              required
              defaultValue={defaultSiteId ?? ""}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="" disabled>
                Select site…
              </option>
              {sites.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {state?.error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending || sites.length === 0}
        className="w-full rounded-md bg-[#0E3D52] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#0E3D52]/90 disabled:opacity-60"
      >
        {pending ? "Creating worker…" : "Create worker"}
      </button>
    </form>
  );
}
