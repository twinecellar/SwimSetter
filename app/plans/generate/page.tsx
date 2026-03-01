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

  useEffect(() => {
    async function prefill() {
      const response = await fetch("/api/profile/history");
      if (response.status === 401) { router.replace("/auth"); return; }
      if (response.status === 429) { setError("Too many auth requests. Wait about a minute, then retry."); return; }
      if (!response.ok) { setError("Unable to load profile data. Please retry."); return; }

      const json = (await response.json()) as {
        profile: { id: string } | null;
        plans: PlanRow[];
      };

      if (!json.profile) { router.replace("/onboarding"); return; }

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

    void prefill();
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
        if (response.status === 429 || json.code === "OVER_REQUEST_RATE_LIMIT") {
          setError("Too many auth requests. Wait about a minute, then retry.");
          return;
        }
        if (json.code === "NO_PROFILE") { router.push("/onboarding"); return; }
        setError(json.error ?? "Failed to generate plan.");
        return;
      }

      const json = (await response.json()) as { plan: GeneratedPlan; request: PlanRequest };
      setPlan(json.plan);
      setGeneratedRequest(json.request);
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
    <div>
      {/* Hero heading */}
      <div style={{ padding: '8px 24px 28px', animation: 'fadeUp 0.4s ease 0.12s both' }}>
        <h2 style={{
          fontFamily: 'var(--font-fraunces)',
          fontSize: '24px', fontWeight: 600, lineHeight: 1.25,
          letterSpacing: '-0.5px', color: 'var(--ink)',
          margin: 0,
        }}>
          What are you feeling{' '}
          <em style={{ fontStyle: 'italic', color: 'var(--water)' }}>today?</em>
        </h2>
      </div>

      {/* Form controls */}
      <GenerateControls
        value={request}
        onChange={setRequest}
        disabled={generating || accepting}
      />

      {/* Generate button */}
      <div style={{ animation: 'fadeUp 0.4s ease 0.3s both', padding: '0 24px 32px' }}>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={generating || accepting}
          className={`goby-generate-btn${generating ? ' is-generating' : ''}`}
          style={{
            position: 'relative', overflow: 'hidden',
            width: '100%', background: 'var(--yolk)',
            borderRadius: 'var(--radius)', padding: '20px 24px',
            fontFamily: 'var(--font-fraunces)', fontSize: '20px', fontWeight: 700,
            color: 'var(--ink)', letterSpacing: '-0.3px',
            boxShadow: '0 6px 24px rgba(245,200,0,0.4)',
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
          }}
        >
          <span
            style={{
              position: 'absolute', inset: 0, pointerEvents: 'none',
              background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 50%)',
            }}
            aria-hidden="true"
          />
          <div className="fish-bubbles">
            <div className="bubbles">
              <span className="bubble b1" />
              <span className="bubble b2" />
              <span className="bubble b3" />
            </div>
            <svg width="28" height="18" viewBox="0 0 80 50" fill="none">
              <ellipse cx="38" cy="25" rx="26" ry="13" fill="currentColor"/>
              <path d="M64 25 C72 15, 78 12, 76 25 C78 38, 72 35, 64 25Z" fill="currentColor"/>
              <ellipse cx="20" cy="22" rx="3.5" ry="3.5" fill="#F5C800"/>
              <ellipse cx="21" cy="21" rx="1.2" ry="1.2" fill="white"/>
              <path d="M12 25 C8 20, 4 18, 6 25 C4 32, 8 30, 12 25Z" fill="currentColor" opacity="0.6"/>
            </svg>
          </div>
          <span style={{ position: 'relative' }}>
            {generating ? 'Generating...' : plan ? 'Regenerate' : 'Generate session'}
          </span>
        </button>
      </div>

      {/* Error message */}
      {error && (
        <p style={{
          color: 'var(--coral)', padding: '0 24px 16px',
          fontFamily: 'var(--font-dm-sans)', fontSize: '14px', margin: 0,
        }}>
          {error}
        </p>
      )}

      {/* Generated plan */}
      {plan && (
        <div style={{ paddingBottom: '40px' }}>
          <PlanCard title="Generated plan" request={generatedRequest ?? request} plan={plan} />
          <div style={{ padding: '0 24px' }}>
            <button
              type="button"
              onClick={handleAccept}
              disabled={accepting || generating}
              className="goby-accept-btn"
              style={{
                width: '100%',
                background: 'var(--yolk)', borderRadius: 'var(--radius)',
                padding: '20px 24px', border: 'none', cursor: 'pointer',
                fontFamily: 'var(--font-fraunces)', fontSize: '20px', fontWeight: 700,
                color: 'var(--ink)', letterSpacing: '-0.3px',
                boxShadow: '0 6px 24px rgba(245,200,0,0.4)',
              }}
            >
              {accepting ? 'Saving...' : "Let's do it!"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
