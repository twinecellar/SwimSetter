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
        const isRateLimit =
          (signUpError as any).status === 429 ||
          signUpError.message?.toLowerCase().includes("rate limit");
        setMessage(
          isRateLimit
            ? "Supabase is rate-limiting sign-up emails right now (limit: a few per hour). Wait a minute, then ask for a fresh invite link and try again."
            : signUpError.message,
        );
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

  const waveBg = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cpath d='M0 40 C25 35, 50 45, 75 40 C100 35, 125 45, 150 40 C175 35, 200 45, 200 40' stroke='%233B9EBF' stroke-width='0.6' fill='none' opacity='0.07'/%3E%3Cpath d='M0 80 C30 75, 55 85, 80 80 C110 75, 130 85, 160 80 C180 75, 200 85, 200 80' stroke='%233B9EBF' stroke-width='0.6' fill='none' opacity='0.05'/%3E%3Cpath d='M0 120 C20 115, 50 125, 80 120 C110 115, 140 125, 160 120 C180 115, 200 125, 200 120' stroke='%233B9EBF' stroke-width='0.6' fill='none' opacity='0.06'/%3E%3Cpath d='M0 160 C25 155, 60 165, 90 160 C120 155, 150 165, 175 160 C185 155, 200 165, 200 160' stroke='%233B9EBF' stroke-width='0.6' fill='none' opacity='0.04'/%3E%3C/svg%3E")`;

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontFamily: "var(--font-dm-sans)",
    fontSize: "12px",
    fontWeight: 600,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: "rgba(61,61,82,0.5)",
    marginBottom: "6px",
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "var(--fog)",
    border: "1.5px solid var(--fog-dark)",
    borderRadius: "var(--radius-sm)",
    padding: "14px 16px",
    fontFamily: "var(--font-dm-sans)",
    fontSize: "15px",
    color: "var(--ink)",
    outline: "none",
    boxSizing: "border-box",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--fog)",
        backgroundImage: waveBg,
        backgroundRepeat: "repeat",
        backgroundSize: "200px 200px",
      }}
    >
      {/* Header */}
      <header
        style={{
          padding: "52px 24px 20px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          animation: "fadeUp 0.4s ease both",
        }}
      >
        <svg width="36" height="36" viewBox="0 0 80 50" fill="none" xmlns="http://www.w3.org/2000/svg">
          <ellipse cx="38" cy="25" rx="26" ry="13" fill="#F5C800" />
          <path d="M64 25 C72 15, 78 12, 76 25 C78 38, 72 35, 64 25Z" fill="#F5C800" />
          <ellipse cx="20" cy="22" rx="3.5" ry="3.5" fill="#1A1A2A" />
          <ellipse cx="21" cy="21" rx="1.2" ry="1.2" fill="white" />
          <path d="M30 20 C33 18, 36 18, 38 20" stroke="#D4A900" strokeWidth="1.5" strokeLinecap="round" fill="none" />
          <path d="M12 25 C8 20, 4 18, 6 25 C4 32, 8 30, 12 25Z" fill="#D4A900" />
        </svg>
        <span
          style={{
            fontFamily: "var(--font-fraunces)",
            fontSize: "26px",
            fontWeight: 700,
            color: "var(--ink)",
            letterSpacing: "-0.5px",
          }}
        >
          goby
        </span>
      </header>

      {/* Content area */}
      <div style={{ maxWidth: "390px", margin: "0 auto" }}>
        {/* Heading + subtext — outside the card */}
        <div style={{ animation: "fadeUp 0.4s ease 0.08s both" }}>
          <h2
            style={{
              fontFamily: "var(--font-fraunces)",
              fontSize: "28px",
              fontWeight: 600,
              letterSpacing: "-0.5px",
              color: "var(--ink)",
              margin: 0,
              padding: "0 24px 8px",
            }}
          >
            Let&apos;s get swimming
          </h2>
          <p
            style={{
              fontFamily: "var(--font-dm-sans)",
              fontSize: "15px",
              color: "rgba(61,61,82,0.6)",
              margin: 0,
              padding: "0 24px 20px",
            }}
          >
            {isSignUp
              ? "You've been invited to jump in. Set up here."
              : "Sign in to your account to continue."}
          </p>
        </div>

        {/* Form card */}
        <div
          style={{
            background: "white",
            borderRadius: "var(--radius)",
            boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
            padding: "32px 24px",
            margin: "0 24px",
            animation: "fadeUp 0.4s ease 0.16s both",
          }}
        >
          <form onSubmit={isSignUp ? handleSignUp : handleSignIn}>
            {/* Email field */}
            <div style={{ marginBottom: "16px" }}>
              <label htmlFor="auth-email" style={labelStyle}>
                Email
              </label>
              <input
                id="auth-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="auth-input"
                style={inputStyle}
              />
            </div>

            {/* Password field */}
            <div>
              <label htmlFor="auth-password" style={labelStyle}>
                Password
              </label>
              <input
                id="auth-password"
                type="password"
                required
                minLength={isSignUp ? 8 : undefined}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isSignUp ? "At least 8 characters" : "Your password"}
                className="auth-input"
                style={inputStyle}
              />
            </div>

            {/* Error / status message */}
            {message && (
              <p
                style={{
                  fontFamily: "var(--font-dm-sans)",
                  fontSize: "13px",
                  color: status === "error" ? "var(--coral)" : "var(--ink-soft)",
                  margin: "8px 0 0",
                }}
              >
                {message}
              </p>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={status === "loading" || !email || !password}
              className="auth-submit-btn"
              style={{
                width: "100%",
                background: "var(--yolk)",
                border: "none",
                borderRadius: "var(--radius)",
                padding: "18px 24px",
                fontFamily: "var(--font-fraunces)",
                fontSize: "18px",
                fontWeight: 700,
                color: "var(--ink)",
                letterSpacing: "-0.3px",
                cursor: "pointer",
                boxShadow: "0 6px 24px rgba(245,200,0,0.4)",
                marginTop: "20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
              }}
            >
              {status === "loading" ? (
                isSignUp ? "Starting swimming..." : "Signing in..."
              ) : isSignUp ? (
                <>
                  <svg width="20" height="14" viewBox="0 0 80 50" fill="none" aria-hidden="true">
                    <ellipse cx="38" cy="25" rx="26" ry="13" fill="currentColor" />
                    <path d="M64 25 C72 15, 78 12, 76 25 C78 38, 72 35, 64 25Z" fill="currentColor" />
                    <ellipse cx="20" cy="22" rx="3.5" ry="3.5" fill="#F5C800" />
                    <ellipse cx="21" cy="21" rx="1.2" ry="1.2" fill="white" />
                    <path d="M12 25 C8 20, 4 18, 6 25 C4 32, 8 30, 12 25Z" fill="currentColor" opacity="0.6" />
                  </svg>
                  Start swimming
                </>
              ) : (
                "Sign in"
              )}
            </button>
          </form>
        </div>

        {/* Secondary link — outside the card */}
        <p
          style={{
            fontFamily: "var(--font-dm-sans)",
            fontSize: "14px",
            textAlign: "center",
            margin: 0,
            padding: "20px 24px 40px",
            animation: "fadeUp 0.4s ease 0.24s both",
          }}
        >
          {isSignUp ? (
            <>
              <span style={{ color: "rgba(61,61,82,0.6)" }}>Already have an account? </span>
              <a href="/auth" style={{ color: "var(--water)", fontWeight: 500, textDecoration: "none" }}>
                Sign in
              </a>
            </>
          ) : (
            <span style={{ color: "rgba(61,61,82,0.6)" }}>
              Don&apos;t have an account? You&apos;ll need an invite link to join.
            </span>
          )}
        </p>
      </div>
    </div>
  );
}
