import Link from "next/link";
import type { CompletionRow, Effort, PlanRow } from "@/lib/plan-types";

const EFFORT_PILL: Record<Effort, { bg: string; border: string; color: string }> = {
  easy:   { bg: 'var(--mint-light)',  border: 'var(--mint)',  color: 'var(--mint)'  },
  medium: { bg: '#FFF5E6',            border: 'var(--coral)', color: 'var(--coral)' },
  hard:   { bg: 'var(--coral-light)', border: 'var(--coral)', color: 'var(--coral)' },
};

interface SessionRowProps {
  plan: PlanRow;
  completion?: CompletionRow;
}

export function SessionRow({ plan, completion }: SessionRowProps) {
  const date = new Date(plan.created_at).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const distance =
    plan.plan.segments.reduce((sum, s) => sum + s.distance_m, 0) ||
    plan.plan.estimated_distance_m;

  const effort = plan.request.effort as Effort;
  const effortPill = EFFORT_PILL[effort] ?? EFFORT_PILL.medium;

  const requestedTags = plan.request.requested_tags ?? [];
  const completionTags = completion?.tags ?? [];

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

  const showRate = completion != null && completion.rating == null;

  return (
    <Link
      href={`/plans/${plan.id}`}
      prefetch={false}
      className="goby-session-card"
      style={{
        background: 'white',
        borderRadius: 'var(--radius)',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        padding: '16px 20px',
        margin: '0 24px 10px',
      }}
    >
      {/* Row 1: date + chevron */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: '8px',
      }}>
        <span style={{
          fontFamily: 'var(--font-dm-sans)',
          fontSize: '15px', fontWeight: 600, color: 'var(--ink)',
        }}>
          {date}
        </span>
        <span style={{ color: 'var(--ink-soft)', opacity: 0.3, fontSize: '20px', lineHeight: 1 }}>
          ›
        </span>
      </div>

      {/* Row 2: distance + rating + effort pill + tags */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
        <span style={{
          fontFamily: 'var(--font-fraunces)',
          fontSize: '14px', fontWeight: 600,
          color: 'var(--ink-soft)', opacity: 0.6,
        }}>
          {distance.toLocaleString()}m
        </span>

        {ratingIcon && (
          <span style={{ display: 'inline-flex', alignItems: 'center' }}>
            {ratingIcon}
          </span>
        )}

        {showRate && (
          <span style={{
            fontFamily: 'var(--font-dm-sans)',
            fontSize: '13px', fontWeight: 500, color: 'var(--water)',
          }}>
            Rate
          </span>
        )}

        <span style={{
          border: `1.5px solid ${effortPill.border}`,
          background: effortPill.bg,
          borderRadius: '100px', padding: '4px 12px',
          fontFamily: 'var(--font-dm-sans)', fontSize: '12px', fontWeight: 500,
          color: effortPill.color, textTransform: 'capitalize',
        }}>
          {effort}
        </span>

        {requestedTags.slice(0, 3).map((tag) => (
          <span
            key={`req-${tag}`}
            style={{
              border: '1.5px solid var(--fog-dark)', background: 'white',
              borderRadius: '100px', padding: '4px 12px',
              fontFamily: 'var(--font-dm-sans)', fontSize: '12px', fontWeight: 500,
              color: 'var(--ink-soft)', textTransform: 'capitalize',
            }}
          >
            {tag}
          </span>
        ))}

        {completionTags.slice(0, 2).map((tag) => (
          <span
            key={`comp-${tag}`}
            style={{
              border: '1.5px solid var(--water-light)', background: 'var(--water-light)',
              borderRadius: '100px', padding: '4px 12px',
              fontFamily: 'var(--font-dm-sans)', fontSize: '12px', fontWeight: 500,
              color: 'var(--water)', textTransform: 'capitalize',
            }}
          >
            {tag}
          </span>
        ))}
      </div>
    </Link>
  );
}
