"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Effort = "easy" | "medium" | "hard";
type FunMode = "straightforward" | "fun";

interface PlanRequest {
  duration_minutes: 20 | 30;
  effort: Effort;
  fun_mode: FunMode;
}

interface PlanSegment {
  id: string;
  type: string;
  distance_m: number;
  stroke: string;
  description: string;
  effort: Effort;
}

interface GeneratedPlan {
  duration_minutes: number;
  estimated_distance_m: number;
  segments: PlanSegment[];
  metadata: {
    version: string;
    swim_level: string;
    input_effort: Effort;
    input_fun_mode: FunMode;
  };
}

export default function GeneratePlanPage() {
  const router = useRouter();
  const [request, setRequest] = useState<PlanRequest>({
    duration_minutes: 20,
    effort: "easy",
    fun_mode: "straightforward",
  });
  const [plan, setPlan] = useState<GeneratedPlan | null>(null);
  const [generating, setGenerating] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function ensureProfile() {
      const response = await fetch("/api/profile/history");
      if (response.status === 401) {
        router.replace("/auth");
        return;
      }
      const json = await response.json();
      if (!json.profile) {
        router.replace("/onboarding");
      }
    }
    void ensureProfile();
  }, [router]);

  async function handleGenerate() {
    setGenerating(true);
    setError(null);
    try {
      const response = await fetch("/api/plans/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const json = await response.json().catch(() => ({}));
        if (json.code === "NO_PROFILE") {
          router.push("/onboarding");
          return;
        }
        setError(json.error ?? "Failed to generate plan.");
        return;
      }

      const json = (await response.json()) as {
        plan: GeneratedPlan;
        request: PlanRequest;
      };
      setPlan(json.plan);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setGenerating(false);
    }
  }

  async function handleAccept() {
    if (!plan) return;
    setAccepting(true);
    setError(null);
    try {
      const response = await fetch("/api/plans/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ request, plan }),
      });

      if (!response.ok) {
        const json = await response.json().catch(() => ({}));
        setError(json.error ?? "Failed to accept plan.");
        return;
      }

      router.push("/plans");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setAccepting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">
          Generate a swim session
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          Choose duration and feel, then we&apos;ll build a simple structured
          set.
        </p>
      </div>

      <div className="space-y-4 rounded-lg border border-slate-800 bg-slate-900/40 p-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Duration
            </p>
            <div className="mt-2 flex gap-2">
              {[20, 30].map((minutes) => (
                <button
                  key={minutes}
                  type="button"
                  onClick={() =>
                    setRequest((prev) => ({
                      ...prev,
                      duration_minutes: minutes as 20 | 30,
                    }))
                  }
                  className={`rounded-md px-3 py-1.5 text-sm ${
                    request.duration_minutes === minutes
                      ? "bg-sky-500 text-slate-950"
                      : "bg-slate-900 text-slate-200 hover:bg-slate-800"
                  }`}
                >
                  {minutes} min
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Effort
            </p>
            <div className="mt-2 flex gap-2">
              {["easy", "medium", "hard"].map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() =>
                    setRequest((prev) => ({
                      ...prev,
                      effort: level as Effort,
                    }))
                  }
                  className={`rounded-md px-3 py-1.5 text-sm capitalize ${
                    request.effort === level
                      ? "bg-sky-500 text-slate-950"
                      : "bg-slate-900 text-slate-200 hover:bg-slate-800"
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Style
            </p>
            <div className="mt-2 flex gap-2">
              {[
                { value: "straightforward", label: "Straightforward" },
                { value: "fun", label: "Fun / varied" },
              ].map((mode) => (
                <button
                  key={mode.value}
                  type="button"
                  onClick={() =>
                    setRequest((prev) => ({
                      ...prev,
                      fun_mode: mode.value as FunMode,
                    }))
                  }
                  className={`rounded-md px-3 py-1.5 text-sm ${
                    request.fun_mode === mode.value
                      ? "bg-sky-500 text-slate-950"
                      : "bg-slate-900 text-slate-200 hover:bg-slate-800"
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={generating}
            className="inline-flex items-center rounded-md bg-sky-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-sky-400 disabled:opacity-60"
          >
            {generating ? "Generating..." : "Generate plan"}
          </button>
          {plan && (
            <button
              type="button"
              onClick={handleAccept}
              disabled={accepting}
              className="inline-flex items-center rounded-md border border-sky-500 px-4 py-2 text-sm font-medium text-sky-300 hover:bg-sky-500/10 disabled:opacity-60"
            >
              {accepting ? "Saving..." : "Accept plan"}
            </button>
          )}
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}
      </div>

      {plan && (
        <div className="space-y-3 rounded-lg border border-slate-800 bg-slate-900/40 p-4">
          <div className="flex items-baseline justify-between gap-2">
            <div>
              <p className="text-sm font-medium text-slate-100">Generated plan</p>
              <p className="text-xs text-slate-400">
                ~{plan.estimated_distance_m}m · {plan.duration_minutes} min ·{" "}
                {plan.metadata.swim_level} · {plan.metadata.input_effort} ·{" "}
                {plan.metadata.input_fun_mode}
              </p>
            </div>
          </div>

          <ol className="space-y-2 text-sm">
            {plan.segments.map((segment, index) => (
              <li
                key={segment.id}
                className="rounded-md border border-slate-800 bg-slate-900/60 px-3 py-2"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-400">
                    #{index + 1} · {segment.type}
                  </span>
                  <span className="text-xs text-slate-400">
                    {segment.distance_m}m · {segment.stroke}
                  </span>
                </div>
                <p className="mt-1 text-slate-100">{segment.description}</p>
              </li>
            ))}
          </ol>
        </div>
      )}

      {!plan && (
        <p className="text-sm text-slate-400">
          No plan yet. Choose your options and hit{" "}
          <span className="font-medium text-slate-200">Generate plan</span>.
        </p>
      )}
    </div>
  );
}

