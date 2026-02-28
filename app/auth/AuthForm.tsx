"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

interface AuthFormProps {
  inviteToken: string | null;
}

export function AuthForm({ inviteToken }: AuthFormProps) {
  const router = useRouter();
  const isSignUp = !!inviteToken;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function handleSignIn(event: FormEvent) {
    event.preventDefault();
    setStatus("loading");
    setMessage(null);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });

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

  async function handleSignUp(event: FormEvent) {
    event.preventDefault();
    setStatus("loading");
    setMessage(null);

    try {
      // Step 1: validate + consume invite token server-side
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteToken }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setStatus("error");
        const msg = json.error ?? "Failed to validate invite.";
        setMessage(json.detail ? `${msg} (${json.detail})` : msg);
        return;
      }

      // Step 2: create account client-side
      const supabase = createSupabaseBrowserClient();
      const { error: signUpError } = await supabase.auth.signUp({ email, password });

      if (signUpError) {
        setStatus("error");
        setMessage(signUpError.message);
        return;
      }

      // Step 3: sign in immediately (works when email confirmation is off in Supabase)
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        // Email confirmation is enabled — ask them to confirm first
        setStatus("idle");
        setMessage("Account created! Check your email to confirm, then sign in.");
        return;
      }

      router.push("/onboarding");
    } catch {
      setStatus("error");
      setMessage("Something went wrong. Please try again.");
    }
  }

  return (
    <div className="space-y-6">
      {isSignUp ? (
        <>
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Let&apos;s get swimming</h2>
            <p className="mt-1 text-sm text-slate-400">
              You&apos;ve been invitited to jump in. Set up here.
            </p>
          </div>

          <form onSubmit={handleSignUp} className="space-y-4">
            <label className="block text-sm font-medium text-slate-200">
              Email
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 outline-none focus:border-sky-500"
                placeholder="you@example.com"
              />
            </label>

            <label className="block text-sm font-medium text-slate-200">
              Password
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 outline-none focus:border-sky-500"
                placeholder="At least 8 characters"
              />
            </label>

            <button
              type="submit"
              disabled={status === "loading" || !email || !password}
              className="inline-flex items-center rounded-md bg-sky-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-sky-400 disabled:opacity-60"
            >
              {status === "loading" ? (
                "Starting swimming..."
              ) : (
                <>
                  <img src="/logos/Fire_light.svg" alt="" width={16} height={16} className="mr-2" />
                  Start swimming
                </>
              )}
            </button>
          </form>

          <p className="text-sm text-slate-500">
            Already have an account?{" "}
            <a href="/auth" className="text-sky-400 hover:text-sky-300">
              Sign in
            </a>
          </p>
        </>
      ) : (
        <>
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Sign in</h2>
            <p className="mt-1 text-sm text-slate-400">
              Don&apos;t have an account? You&apos;ll need an invite link to join.
            </p>
          </div>

          <form onSubmit={handleSignIn} className="space-y-4">
            <label className="block text-sm font-medium text-slate-200">
              Email
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 outline-none focus:border-sky-500"
                placeholder="Your password"
              />
            </label>

            <button
              type="submit"
              disabled={status === "loading" || !email || !password}
              className="inline-flex items-center rounded-md bg-sky-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-sky-400 disabled:opacity-60"
            >
              {status === "loading" ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </>
      )}

      {message && (
        <p className={`text-sm ${status === "error" ? "text-red-400" : "text-slate-300"}`}>
          {message}
        </p>
      )}
    </div>
  );
}
