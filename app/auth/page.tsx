"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function AuthPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "authenticating" | "error">(
    "idle",
  );
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setStatus("authenticating");
    setMessage(null);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setStatus("error");
        setMessage(error.message);
        return;
      }

      router.push("/");
    } catch {
      setStatus("error");
      setMessage("Something went wrong. Please try again.");
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <h2 className="text-xl font-semibold tracking-tight">
        Sign in (dev user)
      </h2>
      <p className="text-sm text-slate-400">
        Use the email and password of a user you've created in the Supabase
        dashboard.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block text-sm font-medium text-slate-200">
          Email
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 outline-none focus:border-sky-500"
            placeholder="you@example.com"
          />
        </label>

        <label className="block text-sm font-medium text-slate-200">
          Password
          <input
            type="password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 outline-none focus:border-sky-500"
            placeholder="Your dev password"
          />
        </label>

        <button
          type="submit"
          disabled={status === "authenticating" || !email || !password}
          className="inline-flex items-center rounded-md bg-sky-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-sky-400 disabled:opacity-60"
        >
          {status === "authenticating" ? "Signing in..." : "Sign in"}
        </button>
      </form>

      {message && (
        <p
          className={`text-sm ${
            status === "error" ? "text-red-400" : "text-slate-300"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
}

