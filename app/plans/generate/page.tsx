"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { GenerateControls } from "@/app/components/GenerateControls";
import { PlanCard } from "@/app/components/PlanCard";
import type { GeneratedPlan, PlanRequest, PlanRow } from "@/lib/plan-types";
import { isDurationMinutes, normalizeRequestedTags } from "@/lib/request-options";

export default function GeneratePlanPage() {
  const router = useRouter();
  const [request, setRequest] = useState<PlanRequest>({
    duration_minutes: 30,
    effort: "medium",
    requested_tags: [],
  });
  const [plan, setPlan] = useState<GeneratedPlan | null>(null);
  const [generatedRequest, setGeneratedRequest] = useState<PlanRequest | null>(null);
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
        setRequest({
          duration_minutes: isDurationMinutes(mostRecentRequest.duration_minutes)
            ? mostRecentRequest.duration_minutes
            : 30,
          effort: mostRecentRequest.effort,
          requested_tags: normalizeRequestedTags(mostRecentRequest.requested_tags),
        });
      }
    }

    void ensureProfileAndPrefill();
  }, [router]);

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
      setGeneratedRequest(json.request);
      setGeneratedAt(hadPlan ? "Regenerated just now." : "Generated just now.");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setGenerating(false);
    }
  }

  async function handleAccept() {
    if (!plan) return;
    const requestToSave = generatedRequest ?? request;
    setAccepting(true);
    setError(null);

    try {
      const response = await fetch("/api/plans/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ request: requestToSave, plan }),
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
      <div className="space-y-5">
        <GenerateControls value={request} disabled={generating || accepting} onChange={setRequest} />

        <button
          type="button"
          onClick={handleGenerate}
          disabled={generating || accepting}
          className="flex w-full items-center justify-center gap-2 rounded-md border px-4 py-2.5 text-sm font-medium disabled:opacity-60"
          style={{
            backgroundColor: plan ? "#003366" : "#FFD700",
            borderColor: plan ? "#003366" : "#FFD700",
            color: plan ? "#ffffff" : "#003366",
          }}
        >
          {!generating && (
            <svg width="16" height="16" viewBox="0 0 53 53" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.7 20.9C24.6 17.6 30 12 33.1 5C31.1 2.9 28.5 1.4 25.7 0.5L24.2 0C24.1 0.2 24 0.500012 24 0.700012C21.6 7.50001 16.7 13 10.1 16.1C5.50001 18.3 2.1 22.3 0.5 27.1L0 28.6C0.2 28.7 0.500005 28.8 0.700005 28.8C2.6 29.5 4.5 30.4 6.3 31.5C8.8 27 12.8 23.2 17.7 20.9Z" fill="currentColor"/>
              <path d="M46.7 21.3C43 26.9 37.9 31.4 31.6 34.4C26.5 36.8 22.6 41.3 20.8 46.7L20.3 48.4C22.2 50.1 24.5 51.4 27 52.2L28.5 52.7C28.6 52.5 28.7 52.2 28.7 52C31.1 45.2 36 39.7 42.6 36.6C47.2 34.4 50.7 30.4 52.2 25.6L52.7 24.1C50.6 23.5 48.6 22.5 46.7 21.3Z" fill="currentColor"/>
              <path d="M16.3 43.2C18.8 37.2 23.4 32.3 29.3 29.5C34.7 26.9 39.2 22.9 42.3 18C40 15.8 38.1 13.3 36.7 10.3C33 17.1 27.2 22.6 20.1 26C16 27.9 12.7 31.2 10.7 35.2C12.9 37.3 14.7 39.9 16.1 42.8C16.1 42.8 16.2 43 16.3 43.2Z" fill="currentColor"/>
            </svg>
          )}
          {generating ? "Generating..." : plan ? "Regenerate" : "Generate"}
        </button>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      {plan && (
        <div className="space-y-4">
          {generatedAt && <p className="text-xs text-emerald-600">{generatedAt}</p>}
          <PlanCard title="Generated plan" request={generatedRequest ?? request} plan={plan} />
          <button
            type="button"
            onClick={handleAccept}
            disabled={accepting || generating}
            className="flex w-full items-center justify-center gap-2 rounded-md border px-4 py-2.5 text-sm font-medium disabled:opacity-60"
            style={{
              backgroundColor: "#FFD700",
              borderColor: "#FFD700",
              color: "#003366",
            }}
          >
            {!accepting && (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="9" stroke="currentColor"/>
                <path d="M8 12L11 15L16 9" stroke="currentColor"/>
              </svg>
            )}
            {accepting ? "Saving..." : "Let's do it!"}
          </button>
        </div>
      )}
    </div>
  );
}
