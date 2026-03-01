import type { CompletionRow, Effort, GeneratedPlan, PlanRequest } from "@/lib/plan-types";
import { SessionStatusBadge } from "@/app/components/SessionStatusBadge";
import { PlanBreakdown } from "@/app/components/PlanBreakdown";

const EFFORT_PILL: Record<Effort, { bg: string; border: string; color: string }> = {
  easy:   { bg: 'var(--mint-light)',  border: 'var(--mint)',  color: 'var(--mint)'  },
  medium: { bg: '#FFF5E6',            border: 'var(--coral)', color: 'var(--coral)' },
  hard:   { bg: 'var(--coral-light)', border: 'var(--coral)', color: 'var(--coral)' },
};

interface PlanCardProps {
  title: React.ReactNode;
  request?: PlanRequest;
  plan: Pick<GeneratedPlan, "duration_minutes" | "estimated_distance_m" | "segments">;
  status?: "planned" | "in_progress" | "completed";
  completion?: CompletionRow;
  actions?: React.ReactNode;
}

export function PlanCard({ title, request, plan, status, completion, actions }: PlanCardProps) {
  const totalDistanceM =
    plan.segments.reduce((sum, segment) => sum + segment.distance_m, 0) ||
    plan.estimated_distance_m;

  const effortPill = request ? EFFORT_PILL[request.effort as Effort] : null;

  const ratingIcon =
    completion?.rating === 1 ? (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--mint)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3zM7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3" />
      </svg>
    ) : completion?.rating === 0 ? (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--coral)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 15v4a3 3 0 003 3l4-9V2H5.72a2 2 0 00-2 1.7l-1.38 9a2 2 0 002 2.3zm7-13h2.67A2.31 2.31 0 0122 4v7a2.31 2.31 0 01-2.33 2H17" />
      </svg>
    ) : null;

  return (
    <section style={{
      background: 'white',
      borderRadius: 'var(--radius)',
      padding: '20px 24px 100px',
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      margin: '0 24px 20px',
    }}>
      {/* Header: title + distance + pills + prompt — fades up first */}
      <div style={{ animation: 'fadeUp 0.5s ease 0s both' }}>
        {/* Title row */}
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'flex-start', marginBottom: '4px',
        }}>
          <div style={{
            fontFamily: 'var(--font-fraunces)',
            fontSize: '26px', fontWeight: 700, color: 'var(--ink)',
            lineHeight: 1.2, letterSpacing: '-0.5px',
          }}>
            {title}
          </div>
          {status && <SessionStatusBadge status={status} />}
        </div>

        {/* Distance */}
        <p style={{
          fontFamily: 'var(--font-dm-sans)',
          fontSize: '14px', color: 'var(--ink-soft)', opacity: 0.5,
          margin: '4px 0 12px',
        }}>
          ~{totalDistanceM}m
        </p>

        {/* Request pills */}
        {request && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
            <span style={{
              border: '1.5px solid var(--fog-dark)', background: 'white',
              borderRadius: '100px', padding: '6px 14px',
              fontFamily: 'var(--font-dm-sans)', fontSize: '13px', fontWeight: 500,
              color: 'var(--ink-soft)',
            }}>
              {request.duration_minutes} min
            </span>
            {effortPill && (
              <span style={{
                border: `1.5px solid ${effortPill.border}`,
                background: effortPill.bg,
                borderRadius: '100px', padding: '6px 14px',
                fontFamily: 'var(--font-dm-sans)', fontSize: '13px', fontWeight: 500,
                color: effortPill.color, textTransform: 'capitalize',
              }}>
                {request.effort}
              </span>
            )}
            {(request.requested_tags ?? []).slice(0, 5).map((tag) => (
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
        )}

        {/* Prompt nudge */}
        <p style={{
          fontFamily: 'var(--font-dm-sans)',
          fontSize: '13px', fontStyle: 'italic',
          color: 'var(--ink-soft)', opacity: 0.5,
          margin: '12px 0 0',
        }}>
          Swim the session below — tap Done when you&apos;re finished.
        </p>
        <div style={{ borderBottom: '1px solid var(--fog-dark)', margin: '12px 0 20px' }} />
      </div>

      {/* Plan breakdown */}
      <PlanBreakdown segments={plan.segments} />

      {/* Completion feedback */}
      {completion && (ratingIcon || completion.tags.length > 0) && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '16px' }}>
          {ratingIcon && (
            <span style={{
              display: 'inline-flex', alignItems: 'center',
              border: '1.5px solid var(--fog-dark)', background: 'white',
              borderRadius: '100px', padding: '6px 10px',
            }}>
              {ratingIcon}
            </span>
          )}
          {completion.tags.slice(0, 5).map((tag) => (
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

      {/* Actions */}
      {actions && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '20px' }}>
          {actions}
        </div>
      )}
    </section>
  );
}
