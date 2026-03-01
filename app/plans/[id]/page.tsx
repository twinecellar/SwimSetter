import Link from "next/link";
import { redirect } from "next/navigation";
import type { CompletionRow, Effort, PlanRow } from "@/lib/plan-types";
import { PlanBreakdown } from "@/app/components/PlanBreakdown";
import { getUserWithRateLimitHandling } from "@/lib/supabase/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const EFFORT_PILL: Record<Effort, { bg: string; border: string; color: string }> = {
  easy:   { bg: 'var(--mint-light)',  border: 'var(--mint)',  color: 'var(--mint)'  },
  medium: { bg: '#FFF5E6',            border: 'var(--coral)', color: 'var(--coral)' },
  hard:   { bg: 'var(--coral-light)', border: 'var(--coral)', color: 'var(--coral)' },
};

export default async function PlanDetailPage({
  params,
}: {
  params: { id: string };
}) {
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

  const [{ data: plan }, { data: completion }] = await Promise.all([
    supabase
      .from("plans")
      .select("*")
      .eq("id", params.id)
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("plan_completions")
      .select("*")
      .eq("plan_id", params.id)
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  if (!plan) {
    redirect("/plans");
  }

  const typedPlan = plan as unknown as PlanRow;
  const typedCompletion = completion as unknown as CompletionRow | null;

  const date = new Date(typedPlan.created_at).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const distance =
    typedPlan.plan.segments.reduce((sum, s) => sum + s.distance_m, 0) ||
    typedPlan.plan.estimated_distance_m;

  const effort = typedPlan.request.effort as Effort;
  const effortPill = EFFORT_PILL[effort] ?? EFFORT_PILL.medium;

  const ratingIcon =
    typedCompletion?.rating === 1 ? (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--mint)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3zM7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3" />
      </svg>
    ) : typedCompletion?.rating === 0 ? (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--coral)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 15v4a3 3 0 003 3l4-9V2H5.72a2 2 0 00-2 1.7l-1.38 9a2 2 0 002 2.3zm7-13h2.67A2.31 2.31 0 0122 4v7a2.31 2.31 0 01-2.33 2H17" />
      </svg>
    ) : null;

  return (
    <div>
      {/* Header: back link + date */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: '12px',
        padding: '0 24px 24px',
      }}>
        <Link
          href="/plans"
          prefetch={false}
          style={{
            marginTop: '4px', flexShrink: 0,
            color: 'var(--ink-soft)', opacity: 0.5, textDecoration: 'none',
          }}
          aria-label="Back to sessions"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h2 style={{
            fontFamily: 'var(--font-fraunces)',
            fontSize: '22px', fontWeight: 700, color: 'var(--ink)',
            margin: '0 0 4px',
          }}>
            {date}
          </h2>
          <p style={{
            fontFamily: 'var(--font-dm-sans)',
            fontSize: '14px', color: 'var(--ink-soft)', opacity: 0.6,
            margin: 0,
          }}>
            {distance.toLocaleString()}m · {typedPlan.plan.duration_minutes} min
          </p>
        </div>
      </div>

      {/* Session inputs */}
      {typedPlan.request && (
        <div style={{ padding: '0 24px 24px' }}>
          <p style={{
            fontFamily: 'var(--font-dm-sans)',
            fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em',
            textTransform: 'uppercase', color: 'var(--ink-soft)', opacity: 0.5,
            margin: '0 0 12px',
          }}>
            Session inputs
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            <span style={{
              border: '1.5px solid var(--fog-dark)', background: 'white',
              borderRadius: '100px', padding: '6px 14px',
              fontFamily: 'var(--font-dm-sans)', fontSize: '13px', fontWeight: 500,
              color: 'var(--ink-soft)',
            }}>
              {typedPlan.request.duration_minutes} min
            </span>
            <span style={{
              border: `1.5px solid ${effortPill.border}`,
              background: effortPill.bg,
              borderRadius: '100px', padding: '6px 14px',
              fontFamily: 'var(--font-dm-sans)', fontSize: '13px', fontWeight: 500,
              color: effortPill.color, textTransform: 'capitalize',
            }}>
              {typedPlan.request.effort}
            </span>
            {(typedPlan.request.requested_tags ?? []).map((tag) => (
              <span
                key={tag}
                style={{
                  border: '1.5px solid var(--fog-dark)', background: 'white',
                  borderRadius: '100px', padding: '6px 14px',
                  fontFamily: 'var(--font-dm-sans)', fontSize: '13px', fontWeight: 500,
                  color: 'var(--ink-soft)', textTransform: 'capitalize',
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Plan breakdown */}
      <div style={{ padding: '0 24px 24px' }}>
        <p style={{
          fontFamily: 'var(--font-dm-sans)',
          fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em',
          textTransform: 'uppercase', color: 'var(--ink-soft)', opacity: 0.5,
          margin: '0 0 12px',
        }}>
          Plan
        </p>
        <PlanBreakdown segments={typedPlan.plan.segments} />
      </div>

      {/* Feedback */}
      <div style={{ padding: '0 24px 24px' }}>
        <p style={{
          fontFamily: 'var(--font-dm-sans)',
          fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em',
          textTransform: 'uppercase', color: 'var(--ink-soft)', opacity: 0.5,
          margin: '0 0 12px',
        }}>
          Your feedback
        </p>
        {typedCompletion ? (
          <div>
            {(ratingIcon || typedCompletion.tags.length > 0) && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                {ratingIcon && (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center',
                    border: '1.5px solid var(--fog-dark)', background: 'white',
                    borderRadius: '100px', padding: '6px 10px',
                  }}>
                    {ratingIcon}
                  </span>
                )}
                {typedCompletion.tags.map((tag) => (
                  <span
                    key={tag}
                    style={{
                      border: '1.5px solid var(--water-light)', background: 'var(--water-light)',
                      borderRadius: '100px', padding: '6px 14px',
                      fontFamily: 'var(--font-dm-sans)', fontSize: '13px', fontWeight: 500,
                      color: 'var(--water)', textTransform: 'capitalize',
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
            {typedCompletion.notes && (
              <p style={{
                background: 'white', borderRadius: 'var(--radius-sm)',
                padding: '12px 16px',
                fontFamily: 'var(--font-dm-sans)', fontSize: '14px',
                color: 'var(--ink-soft)',
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                margin: 0,
              }}>
                {typedCompletion.notes}
              </p>
            )}
          </div>
        ) : (
          <p style={{
            fontFamily: 'var(--font-dm-sans)', fontSize: '14px',
            color: 'var(--ink-soft)', opacity: 0.5, margin: 0,
          }}>
            No feedback recorded.
          </p>
        )}
      </div>
    </div>
  );
}
