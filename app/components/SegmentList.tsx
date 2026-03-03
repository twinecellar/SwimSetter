import type { PlanSegment } from "@/lib/plan-types";
import { groupSegments } from "@/lib/plan-utils";

interface SegmentListProps {
  segments: PlanSegment[];
}

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

  const timingPatterns = [/\s@ \[[^\]]+\](?:s rest)?/, /\s@ \d+:\d{2}/, /\s@ \d+s rest/];
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

export function SegmentList({ segments }: SegmentListProps) {
  const groups = groupSegments(segments);

  return (
    <div className="space-y-4">
      {groups.map((group) => {
        const groupDistance = group.items.reduce(
          (sum, segment) => sum + segment.distance_m,
          0,
        );

        return (
          <section
            key={group.title}
            className="space-y-2 rounded-lg border border-slate-800 bg-slate-900/30 p-3"
          >
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-sm font-semibold text-slate-100">{group.title}</h4>
              <p className="text-xs text-slate-400">~{groupDistance}m</p>
            </div>

            <ol className="space-y-2">
              {group.items.map((segment, index) => (
                <li key={segment.id} className="rounded-md border border-slate-800 bg-slate-900/60 px-3 py-2">
                  {(() => {
                    const parsed = parseDescription(segment.description);
                    const extracted = extractInlineTimingAndBadges(parsed.title);
                    const timing =
                      formatSendoff(segment.sendoff_seconds) ??
                      formatRest(segment.rest_seconds) ??
                      extracted.timing;

                    return (
                      <>
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-400">
                      #{index + 1} · {segment.type}
                    </span>
                    <span className="text-xs text-slate-400">
                      {segment.distance_m}m · {segment.stroke}
                    </span>
                  </div>
                  <div className="mt-1 flex items-start justify-between gap-2">
                    <p className="text-sm text-slate-100">{extracted.title}</p>
                    {(timing || extracted.badges.length > 0) && (
                      <span className="inline-flex shrink-0 items-center gap-1">
                        {timing && (
                          <span className="rounded-full border border-slate-700 bg-slate-800 px-2 py-0.5 text-[11px] font-medium text-slate-300">
                            {timing}
                          </span>
                        )}
                        {extracted.badges.map((badge) => (
                          <span
                            key={`${segment.id}-${badge}`}
                            className="rounded-full border border-cyan-900/70 bg-cyan-950/50 px-2 py-0.5 text-[11px] font-semibold capitalize text-cyan-300"
                          >
                            {badge}
                          </span>
                        ))}
                      </span>
                    )}
                  </div>
                  {parsed.cue && <p className="mt-1 text-sm text-slate-300">{parsed.cue}</p>}
                      </>
                    );
                  })()}
                </li>
              ))}
            </ol>
          </section>
        );
      })}
    </div>
  );
}
