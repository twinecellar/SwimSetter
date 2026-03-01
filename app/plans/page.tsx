import { redirect } from "next/navigation";
import { HistoryList } from "@/app/components/HistoryList";
import { PlanCard } from "@/app/components/PlanCard";
import { DoneButton } from "@/app/components/DoneButton";
import type { CompletionRow, PlanRow } from "@/lib/plan-types";
import { completionByPlanId } from "@/lib/plan-utils";
import { getUserWithRateLimitHandling } from "@/lib/supabase/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function PlansPage() {
  const supabase = createSupabaseServerClient();
  const { user, rateLimited } = await getUserWithRateLimitHandling(supabase);

  if (rateLimited) {
    return (
      <div style={{
        margin: '0 24px', padding: '20px 24px',
        background: 'white', borderRadius: 'var(--radius)',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      }}>
        <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '14px', color: 'var(--coral)', margin: 0 }}>
          Too many auth requests right now. Wait about a minute, then refresh.
        </p>
      </div>
    );
  }

  if (!user) {
    redirect("/auth");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    redirect("/onboarding");
  }

  const [{ data: plans }, { data: completions }] = await Promise.all([
    supabase
      .from("plans")
      .select("*")
      .eq("user_id", user.id)
      .in("status", ["accepted", "completed"])
      .order("created_at", { ascending: false }),
    supabase
      .from("plan_completions")
      .select("*")
      .eq("user_id", user.id)
      .order("completed_at", { ascending: false })
      .limit(50),
  ]);

  const typedPlans = (plans ?? []) as unknown as PlanRow[];
  const typedCompletions = (completions ?? []) as unknown as CompletionRow[];
  const completionsMap = completionByPlanId(typedCompletions);
  const currentPlan = typedPlans.find((plan) => plan.status === "accepted") ?? null;
  const historyPlans = currentPlan
    ? typedPlans.filter((plan) => plan.id !== currentPlan.id)
    : typedPlans;

  if (!typedPlans.length) {
    return (
      <div>
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', padding: '60px 24px', gap: '16px',
        }}>
          <svg width="40" height="25" viewBox="0 0 80 50" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.2 }}>
            <ellipse cx="38" cy="25" rx="26" ry="13" fill="var(--ink)" />
            <path d="M64 25 C72 15, 78 12, 76 25 C78 38, 72 35, 64 25Z" fill="var(--ink)" />
            <ellipse cx="20" cy="22" rx="3.5" ry="3.5" fill="var(--ink)" />
            <path d="M12 25 C8 20, 4 18, 6 25 C4 32, 8 30, 12 25Z" fill="var(--ink)" />
          </svg>
          <p style={{
            fontFamily: 'var(--font-fraunces)',
            fontStyle: 'italic', fontSize: '16px',
            color: 'var(--ink-soft)', opacity: 0.4,
            margin: 0, textAlign: 'center',
          }}>
            Your sessions will appear here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Current session */}
      {currentPlan && (
        <>
          <PlanCard
            title="Your session"
            request={currentPlan.request}
            plan={currentPlan.plan}
          />
          {/* Sticky footer — always-visible finish action */}
          <div style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '16px 24px 36px',
            background: 'linear-gradient(to top, var(--fog) 60%, rgba(238,243,247,0))',
            zIndex: 100,
            maxWidth: '390px',
            margin: '0 auto',
            animation: 'fadeUp 0.5s ease 0.28s both',
          }}>
            <DoneButton
              href={`/plans/${currentPlan.id}/complete`}
              effort={currentPlan.request.effort}
              duration_minutes={currentPlan.request.duration_minutes}
              tags={currentPlan.request.requested_tags ?? []}
            />
          </div>
        </>
      )}

      {historyPlans.length > 0 && (
        <>
          {/* Last session */}
          <div style={{ padding: '0 24px 16px' }}>
            <h3 style={{
              fontFamily: 'var(--font-fraunces)',
              fontSize: '24px', fontWeight: 600, color: 'var(--ink)',
              margin: 0,
            }}>
              Last session
            </h3>
          </div>
          <HistoryList plans={historyPlans.slice(0, 1)} completionsByPlanId={completionsMap} />

          {/* All sessions heading + remaining */}
          {historyPlans.length > 1 && (
            <>
              <div style={{ padding: '16px 24px 16px' }}>
                <h3 style={{
                  fontFamily: 'var(--font-fraunces)',
                  fontSize: '24px', fontWeight: 600, color: 'var(--ink)',
                  margin: 0,
                }}>
                  All sessions
                </h3>
              </div>
              <HistoryList plans={historyPlans.slice(1)} completionsByPlanId={completionsMap} />
            </>
          )}
        </>
      )}
    </div>
  );
}
