"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Step = "interval" | "rest";

export function OnboardingForm() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("interval");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function saveLevel(level: "beginner" | "intermediate" | "advanced") {
    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ swim_level: level, preferences: {} }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        if (res.status === 429 || json.code === "OVER_REQUEST_RATE_LIMIT") {
          setError("Too many auth requests. Wait about a minute, then retry.");
          setSaving(false);
          return;
        }
        setError(json.error ?? "Failed to save profile.");
        setSaving(false);
        return;
      }

      router.push("/");
    } catch {
      setError("Something went wrong. Please try again.");
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">
          Let&apos;s get a feel for your swimming experience
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          Answer a couple of quick questions so we can tailor your sessions.
        </p>
      </div>

      {step === "interval" && (
        <div className="space-y-5">
          <p className="text-sm font-medium text-slate-200">
            Does this make sense to you?
          </p>

          <div className="rounded-lg border border-slate-700 bg-slate-900/60 px-5 py-4">
            <p className="font-mono text-lg font-semibold tracking-wide text-sky-300">
              4 × 100s off 2:00
            </p>
            <p className="mt-1 text-xs text-slate-500">
              A main set: 4 repetitions of 100 metres, leaving every 2 minutes
            </p>
          </div>

          <div className="flex gap-3">
            <button
              disabled={saving}
              onClick={() => saveLevel("advanced")}
              className="flex-1 rounded-md border border-slate-700 bg-slate-800 px-4 py-3 text-sm font-medium text-slate-100 hover:border-sky-500 hover:bg-slate-700 disabled:opacity-60"
            >
              Yes, I get it
            </button>
            <button
              disabled={saving}
              onClick={() => setStep("rest")}
              className="flex-1 rounded-md border border-slate-700 bg-slate-800 px-4 py-3 text-sm font-medium text-slate-100 hover:border-sky-500 hover:bg-slate-700 disabled:opacity-60"
            >
              Not quite
            </button>
          </div>
        </div>
      )}

      {step === "rest" && (
        <div className="space-y-5">
          <p className="text-sm font-medium text-slate-200">
            What about this format?
          </p>

          <div className="rounded-lg border border-slate-700 bg-slate-900/60 px-5 py-4">
            <p className="font-mono text-lg font-semibold tracking-wide text-sky-300">
              4 × 100s with 15s rest
            </p>
            <p className="mt-1 text-xs text-slate-500">
              4 repetitions of 100 metres, with 15 seconds rest between each
            </p>
          </div>

          <div className="flex gap-3">
            <button
              disabled={saving}
              onClick={() => saveLevel("intermediate")}
              className="flex-1 rounded-md border border-slate-700 bg-slate-800 px-4 py-3 text-sm font-medium text-slate-100 hover:border-sky-500 hover:bg-slate-700 disabled:opacity-60"
            >
              Yes, that&apos;s clear
            </button>
            <button
              disabled={saving}
              onClick={() => saveLevel("beginner")}
              className="flex-1 rounded-md border border-slate-700 bg-slate-800 px-4 py-3 text-sm font-medium text-slate-100 hover:border-sky-500 hover:bg-slate-700 disabled:opacity-60"
            >
              Not really
            </button>
          </div>

          <button
            onClick={() => setStep("interval")}
            className="text-xs text-slate-500 hover:text-slate-400"
          >
            ← Back
          </button>
        </div>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
