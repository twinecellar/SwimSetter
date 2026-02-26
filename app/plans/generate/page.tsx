"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { GenerateControls } from "@/app/components/GenerateControls";
import { PlanCard } from "@/app/components/PlanCard";
import { SegmentList } from "@/app/components/SegmentList";
import type { GeneratedPlan, PlanRequest, PlanRow } from "@/lib/plan-types";

export default function GeneratePlanPage() {
  const router = useRouter();
  const [request, setRequest] = useState<PlanRequest>({
    duration_minutes: 20,
    effort: "easy",
    fun_mode: "straightforward",
  });
  const [lastRequest, setLastRequest] = useState<PlanRequest | null>(null);
  const [plan, setPlan] = useState<GeneratedPlan | null>(null);
  const [generating, setGenerating] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);

  useEffect(() => {
    async function ensureProfileAndPrefill() {
      const response = await fetch("/api/profile/history");
      if (response.status === 401) {
        router.replace("/auth");
        return;
      }
      if (response.status === 429) {
        setError("Too many auth requests. Wait about a minute, then retry.");
        return;
      }

      if (!response.ok) {
        setError("Unable to load profile data. Please retry.");
        return;
      }

      const json = (await response.json()) as {
        profile: { id: string } | null;
        plans: PlanRow[];
      };

      if (!json.profile) {
        router.replace("/onboarding");
        return;
      }

      const mostRecentRequest = json.plans?.[0]?.request;
      if (mostRecentRequest) {
        setRequest(mostRecentRequest);
        setLastRequest(mostRecentRequest);
      }
    }

    void ensureProfileAndPrefill();
  }, [router]);

  const controlsSummary = useMemo(
    () => `${request.duration_minutes}m · ${request.effort} · ${request.fun_mode}`,
    [request],
  );

  async function handleGenerate() {
    const hadPlan = !!plan;
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
        if (response.status === 429 || json.code === "OVER_REQUEST_RATE_LIMIT") {
          setError("Too many auth requests. Wait about a minute, then retry.");
          return;
        }
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
      setGeneratedAt(hadPlan ? "Regenerated just now." : "Generated just now.");
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
        if (response.status === 429 || json.code === "OVER_REQUEST_RATE_LIMIT") {
          setError("Too many auth requests. Wait about a minute, then retry.");
          return;
        }
        setError(json.error ?? "Failed to accept plan.");
        return;
      }

      router.push("/");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setAccepting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Generate a swim session</h2>
        <p className="mt-1 text-sm text-slate-400">
          Adjust preferences quickly, then accept or regenerate without losing context.
        </p>
      </div>

      {lastRequest && (
        <p className="text-xs text-slate-400">
          Based on last request: {lastRequest.duration_minutes}m, {lastRequest.effort},{" "}
          {lastRequest.fun_mode}
        </p>
      )}

      <div className="space-y-4 rounded-lg border border-slate-800 bg-slate-950/95 p-4 backdrop-blur">
        <GenerateControls value={request} disabled={generating || accepting} onChange={setRequest} />

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={generating || accepting}
            className="inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium disabled:opacity-60"
            style={{
              backgroundColor: "#10b981",
              borderColor: "#10b981",
              color: "#111827",
            }}
          >
            {generating ? "Generating..." : plan ? "Regenerate" : "Generate session"}
          </button>

          {plan && (
            <button
              type="button"
              onClick={handleAccept}
              disabled={accepting || generating}
              className="inline-flex items-center rounded-md border border-sky-500 px-4 py-2 text-sm font-medium text-sky-300 hover:bg-sky-500/10 disabled:opacity-60"
            >
              {accepting ? "Saving..." : "Accept session"}
            </button>
          )}

        </div>

        <p className="text-xs text-slate-400">Current controls: {controlsSummary}</p>

        {generatedAt && <p className="text-xs text-emerald-300">{generatedAt}</p>}
        {error && <p className="text-sm text-red-400">{error}</p>}
      </div>

      {plan ? (
        <div className="space-y-4">
          <PlanCard title="Generated plan" request={request} plan={plan} />
          <SegmentList segments={plan.segments} />
        </div>
      ) : (
        <section className="rounded-lg border border-slate-800 bg-slate-900/40 p-4 text-sm text-slate-300">
          No plan yet. Choose your preferences and generate a session.
        </section>
      )}
    </div>
  );
}
