"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface OnboardingFormProps {
  initialLevel: "beginner" | "intermediate" | "advanced";
}

export function OnboardingForm({ initialLevel }: OnboardingFormProps) {
  const router = useRouter();
  const [swimLevel, setSwimLevel] = useState(initialLevel);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          swim_level: swimLevel,
          preferences: {},
        }),
      });

      if (!response.ok) {
        const json = await response.json().catch(() => ({}));
        setError(json.error ?? "Failed to save profile.");
        setSaving(false);
        return;
      }

      router.push("/plans/generate");
    } catch {
      setError("Something went wrong. Please try again.");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">
          Tell us your swim level
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          This helps us pick sensible starting sets.
        </p>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-slate-200">
          Swim level
        </legend>

        <div className="space-y-1 text-sm">
          <label className="flex cursor-pointer items-center gap-2 rounded-md border border-slate-800 px-3 py-2 hover:border-sky-500">
            <input
              type="radio"
              name="swim_level"
              value="beginner"
              checked={swimLevel === "beginner"}
              onChange={() => setSwimLevel("beginner")}
            />
            <span>
              <span className="font-medium">Beginner</span>
              <span className="ml-1 text-slate-400">
                Comfortable in the water, building endurance.
              </span>
            </span>
          </label>

          <label className="flex cursor-pointer items-center gap-2 rounded-md border border-slate-800 px-3 py-2 hover:border-sky-500">
            <input
              type="radio"
              name="swim_level"
              value="intermediate"
              checked={swimLevel === "intermediate"}
              onChange={() => setSwimLevel("intermediate")}
            />
            <span>
              <span className="font-medium">Intermediate</span>
              <span className="ml-1 text-slate-400">
                Regular swimmer, happy with structured sets.
              </span>
            </span>
          </label>

          <label className="flex cursor-pointer items-center gap-2 rounded-md border border-slate-800 px-3 py-2 hover:border-sky-500">
            <input
              type="radio"
              name="swim_level"
              value="advanced"
              checked={swimLevel === "advanced"}
              onChange={() => setSwimLevel("advanced")}
            />
            <span>
              <span className="font-medium">Advanced</span>
              <span className="ml-1 text-slate-400">
                Swim training regularly, comfortable with harder work.
              </span>
            </span>
          </label>
        </div>
      </fieldset>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="inline-flex items-center rounded-md bg-sky-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-sky-400 disabled:opacity-60"
      >
        {saving ? "Saving..." : "Save profile"}
      </button>
    </form>
  );
}

