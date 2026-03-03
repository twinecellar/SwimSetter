import type { Effort, PlanSegment } from "@/lib/plan-types";
import { groupSegments } from "@/lib/plan-utils";

const SECTION_DOT: Record<string, string> = {
  "Warm up":   "var(--mint)",
  "Main":      "var(--yolk)",
  "Cool down": "rgba(61,61,82,0.3)",
};

const EFFORT_LEFT_BORDER: Record<Effort, string> = {
  easy:   "var(--mint)",
  medium: "var(--yolk-dark)",
  hard:   "var(--coral)",
};

function formatRest(seconds: number | undefined): string | null {
  if (!seconds || seconds <= 0) return null;
  if (seconds < 60) return `${seconds}s rest`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s === 0 ? `${m}m rest` : `${m}:${String(s).padStart(2, "0")} rest`;
}

function formatSendoff(seconds: number | undefined): string | null {
  if (!seconds || seconds <= 0) return null;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `@ ${m}:${String(s).padStart(2, "0")}`;
}

function parseDescription(description: string): { title: string; cue: string | null } {
  const idx = description.indexOf(" - ");
  if (idx === -1) return { title: description, cue: null };
  return { title: description.slice(0, idx), cue: description.slice(idx + 3) };
}

function extractInlineTimingAndBadges(title: string): {
  title: string;
  timing: string | null;
  badges: string[];
} {
  let cleaned = title.trim();
  let timing: string | null = null;

  const timingPatterns = [
    /\s@ \[[^\]]+\](?:s rest)?/,
    /\s@ \d+:\d{2}/,
    /\s@ \d+s rest/,
  ];

  for (const pattern of timingPatterns) {
    const match = cleaned.match(pattern);
    if (!match) continue;
    timing = match[0].trim();
    const idx = match.index ?? -1;
    if (idx >= 0) {
      const left = cleaned.slice(0, idx).trim();
      const right = cleaned.slice(idx + match[0].length).trim();
      cleaned = [left, right].filter(Boolean).join(" ");
    }
    break;
  }

  const badges: string[] = [];
  const badgeMatch = cleaned.match(/\[([^[\]]+)\]\s*$/);
  if (badgeMatch) {
    badges.push(
      ...badgeMatch[1]
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
    );
    cleaned = cleaned.slice(0, badgeMatch.index).trim();
  }

  const displayTiming = (() => {
    if (!timing) return null;
    const restSeq = timing.match(/^@ \[([^\]]+)\]s rest$/);
    if (restSeq) return `${restSeq[1].split("-").join("/")}s rest`;
    const sendoffSeq = timing.match(/^@ \[([^\]]+)\]$/);
    if (sendoffSeq) return `@ ${sendoffSeq[1].split("-").join("/")}`;
    return timing;
  })();

  return { title: cleaned, timing: displayTiming, badges };
}

function SegmentRow({ segment, isLast }: { segment: PlanSegment; isLast: boolean }) {
  const borderColor = EFFORT_LEFT_BORDER[segment.effort as Effort] ?? "var(--fog-dark)";
  const { title: rawTitle, cue } = parseDescription(segment.description);
  const parsed = extractInlineTimingAndBadges(rawTitle);
  const rest =
    formatSendoff(segment.sendoff_seconds) ??
    formatRest(segment.rest_seconds) ??
    parsed.timing;

  return (
    <div style={{
      paddingTop: '12px', paddingBottom: '12px',
      paddingLeft: '12px',
      borderBottom: isLast ? 'none' : '1px solid var(--fog-dark)',
      borderLeft: `3px solid ${borderColor}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
        <span style={{
          fontFamily: 'var(--font-dm-sans)',
          fontSize: '15px', fontWeight: 600, color: 'var(--ink)',
          lineHeight: 1.4,
        }}>
          {parsed.title}
        </span>
        {(rest || parsed.badges.length > 0) && (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            flexShrink: 0,
            marginTop: '1px',
          }}>
          {rest && (
          <span style={{
            background: 'var(--fog-dark)', color: 'var(--ink-soft)',
            borderRadius: '100px', padding: '4px 10px',
            fontFamily: 'var(--font-dm-sans)', fontSize: '12px', fontWeight: 500,
            whiteSpace: 'nowrap',
          }}>
            {rest}
          </span>
          )}
          {parsed.badges.map((badge) => (
            <span
              key={`${segment.id}-${badge}`}
              style={{
                background: 'rgba(20, 138, 153, 0.08)',
                color: 'var(--water)',
                border: '1px solid rgba(20, 138, 153, 0.2)',
                borderRadius: '100px',
                padding: '4px 8px',
                fontFamily: 'var(--font-dm-sans)',
                fontSize: '11px',
                fontWeight: 600,
                textTransform: 'capitalize',
                whiteSpace: 'nowrap',
              }}
            >
              {badge}
            </span>
          ))}
          </span>
        )}
      </div>
      {cue && (
        <p style={{
          fontFamily: 'var(--font-dm-sans)',
          fontSize: '14px', fontWeight: 400,
          color: 'var(--ink-soft)', marginTop: '4px',
          lineHeight: 1.5, marginBottom: 0,
        }}>
          {cue}
        </p>
      )}
    </div>
  );
}

interface PlanBreakdownProps {
  segments: PlanSegment[];
}

export function PlanBreakdown({ segments }: PlanBreakdownProps) {
  const groups = groupSegments(segments);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {groups.map((group, idx) => {
        const dotColor = SECTION_DOT[group.title] ?? "var(--fog-dark)";
        const sectionDistance = group.items.reduce((sum, s) => sum + s.distance_m, 0);
        const delay = `${0.08 + idx * 0.06}s`;

        return (
          <section
            key={group.title}
            style={{
              background: 'white',
              borderRadius: 'var(--radius)',
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
              padding: '16px 20px',
              overflow: 'hidden',
              animation: `fadeUp 0.5s ease ${delay} both`,
            }}
          >
            {/* Section header */}
            <div style={{
              display: 'flex', alignItems: 'center',
              justifyContent: 'space-between', marginBottom: '12px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  width: '6px', height: '6px', borderRadius: '50%',
                  background: dotColor, flexShrink: 0, display: 'inline-block',
                }} />
                <span style={{
                  fontFamily: 'var(--font-dm-sans)',
                  fontSize: '11px', fontWeight: 600,
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                  color: 'var(--ink-soft)', opacity: 0.5,
                }}>
                  {group.title}
                </span>
              </div>
              <span style={{
                fontFamily: 'var(--font-fraunces)',
                fontSize: '16px', fontWeight: 600,
                color: 'var(--ink-soft)', opacity: 0.4,
              }}>
                {sectionDistance}m
              </span>
            </div>

            {/* Divider */}
            <div style={{ borderTop: '1px solid var(--fog-dark)' }} />

            {/* Steps */}
            <div>
              {group.items.map((segment, i) => (
                <SegmentRow
                  key={segment.id}
                  segment={segment}
                  isLast={i === group.items.length - 1}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
