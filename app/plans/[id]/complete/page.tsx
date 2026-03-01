import { redirect } from "next/navigation";
import { CompletionForm } from "./CompletionForm";
import { CompletionHeading } from "@/app/components/CompletionHeading";
import { effortPillStyle } from "@/lib/effort-colors";
import type { Effort, PlanRow } from "@/lib/plan-types";
import { getUserWithRateLimitHandling } from "@/lib/supabase/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function CompletePlanPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createSupabaseServerClient();
  const { user, rateLimited } = await getUserWithRateLimitHandling(supabase);

  if (rateLimited) {
    return (
      <div style={{
        margin: '0 24px',
        background: 'white',
        borderRadius: 'var(--radius)',
        padding: '24px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      }}>
        <h2 style={{
          fontFamily: 'var(--font-fraunces)',
          fontSize: '20px', fontWeight: 600,
          color: 'var(--ink)', margin: '0 0 8px',
        }}>
          Session Feedback
        </h2>
        <p style={{
          fontFamily: 'var(--font-dm-sans)',
          fontSize: '14px', color: 'var(--ink-soft)',
          margin: 0,
        }}>
          Too many auth requests right now. Wait about a minute, then refresh.
        </p>
      </div>
    );
  }

  if (!user) {
    redirect("/auth");
  }

  const { data: plan } = await supabase
    .from("plans")
    .select("*")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!plan) {
    redirect("/plans");
  }

  const typedPlan = plan as unknown as PlanRow;
  const totalDistance =
    typedPlan.plan.segments.reduce((sum, s) => sum + s.distance_m, 0) ||
    typedPlan.plan.estimated_distance_m;

  return (
    <div>
      {/* Page header */}
      <div style={{ animation: 'fadeUp 0.4s ease 0s both' }}>
        <CompletionHeading />
        <p style={{
          fontFamily: 'var(--font-dm-sans)',
          fontSize: '15px',
          color: 'var(--ink-soft)', opacity: 0.6,
          padding: '0 24px 20px', margin: 0,
        }}>
          How did it go?
        </p>
      </div>

      <CompletionForm planId={typedPlan.id}>
        {/* Session summary — quiet reference row */}
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <span style={{
              fontFamily: 'var(--font-fraunces)',
              fontSize: '15px', fontWeight: 600,
              color: 'var(--ink)',
            }}>
              {typedPlan.request.duration_minutes} min session
            </span>
            <span style={{
              fontFamily: 'var(--font-dm-sans)',
              fontSize: '14px',
              color: 'var(--ink-soft)', opacity: 0.5,
            }}>
              ~{totalDistance}m
            </span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px' }}>
            <span
              style={{
                ...effortPillStyle(typedPlan.request.effort as Effort),
                borderRadius: '100px',
                border: '1px solid',
                padding: '5px 12px',
                fontFamily: 'var(--font-dm-sans)',
                fontSize: '13px', fontWeight: 500,
                textTransform: 'capitalize',
              }}
            >
              {typedPlan.request.effort}
            </span>
            {(typedPlan.request.requested_tags ?? []).slice(0, 5).map((tag) => (
              <span
                key={tag}
                style={{
                  background: 'var(--fog)',
                  border: '1px solid var(--fog-dark)',
                  borderRadius: '100px',
                  padding: '5px 12px',
                  fontFamily: 'var(--font-dm-sans)',
                  fontSize: '13px', fontWeight: 500,
                  color: 'var(--ink-soft)',
                  textTransform: 'capitalize',
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </CompletionForm>
    </div>
  );
}
