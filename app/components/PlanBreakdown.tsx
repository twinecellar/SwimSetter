import type { PlanSegment } from "@/lib/plan-types";
import { groupSegments } from "@/lib/plan-utils";

// Inline styles — Tailwind purges dynamic class names built from object lookups
const EFFORT_COLOR: Record<string, string> = {
  easy: "#38bdf8",   // sky-400
  medium: "#34d399", // emerald-400
  hard: "#f87171",   // red-400
};

const EFFORT_LEGEND = [
  { label: "Easy", color: "#38bdf8" },
  { label: "Medium", color: "#34d399" },
  { label: "Hard", color: "#f87171" },
] as const;

function formatRest(seconds: number | undefined): string | null {
  if (!seconds || seconds <= 0) return null;
  if (seconds < 60) return `${seconds}s rest`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s === 0 ? `${m}m rest` : `${m}:${String(s).padStart(2, "0")} rest`;
}

function SegmentRow({ segment }: { segment: PlanSegment }) {
  const color = EFFORT_COLOR[segment.effort] ?? "#64748b";
  const rest = formatRest(segment.rest_seconds);

  return (
    <div className="flex items-center gap-3 rounded-lg bg-slate-800/60 px-3 py-2.5">
      <span
        className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
        style={{ backgroundColor: color }}
        aria-label={segment.effort}
      />
      <span className="flex-1 text-sm text-slate-200">{segment.description}</span>
      {rest && (
        <span className="flex-shrink-0 text-xs text-slate-500 tabular-nums">{rest}</span>
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
    <div className="space-y-3">
      {groups.map((group) => (
        <section
          key={group.title}
          className="rounded-xl border border-slate-700/60 bg-slate-900/60 p-3"
        >
          <div className="mb-2 flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-300">
              {group.title}
            </h4>
            <span className="text-xs text-slate-500">
              {group.items.reduce((sum, s) => sum + s.distance_m, 0)}m
            </span>
          </div>
          <div className="space-y-1.5">
            {group.items.map((segment) => (
              <SegmentRow key={segment.id} segment={segment} />
            ))}
          </div>
        </section>
      ))}

      <div className="flex flex-wrap gap-x-4 gap-y-1 px-1">
        {EFFORT_LEGEND.map(({ label, color }) => (
          <div key={label} className="flex items-center gap-1.5">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: color }}
            />
            <span className="text-xs text-slate-500">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
