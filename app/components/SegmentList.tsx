import type { PlanSegment } from "@/lib/plan-types";
import { groupSegments } from "@/lib/plan-utils";

interface SegmentListProps {
  segments: PlanSegment[];
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
                <li
                  key={segment.id}
                  className="rounded-md border border-slate-800 bg-slate-900/60 px-3 py-2"
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-400">
                      #{index + 1} · {segment.type}
                    </span>
                    <span className="text-xs text-slate-400">
                      {segment.distance_m}m · {segment.stroke}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-100">{segment.description}</p>
                </li>
              ))}
            </ol>
          </section>
        );
      })}
    </div>
  );
}
