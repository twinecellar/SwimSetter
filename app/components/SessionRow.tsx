import Link from "next/link";
import type { CompletionRow, PlanRow } from "@/lib/plan-types";

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

  const ratingImg =
    completion?.rating === 1
      ? <img src="/thumb_up.png" alt="thumbs up" width={16} height={16} />
      : completion?.rating === 0
        ? <img src="/thumb_down.png" alt="thumbs down" width={16} height={16} />
        : null;

  const requestedTags = plan.request.requested_tags ?? [];
  const completionTags = completion?.tags ?? [];
  const hasTags = requestedTags.length > 0 || completionTags.length > 0;

  return (
    <Link
      href={`/plans/${plan.id}`}
      prefetch={false}
      className="flex items-center justify-between px-3 py-3 rounded-lg bg-slate-800/50 border border-slate-700/60 hover:bg-slate-800/80 hover:border-slate-600/60 transition-colors group shadow-sm"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex-shrink-0">
          <p className="text-sm font-medium text-slate-100">{date}</p>
          <p className="text-xs text-slate-400 mt-0.5">{distance.toLocaleString()}m</p>
        </div>
        {hasTags && (
          <div className="flex flex-col gap-1">
            {requestedTags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {requestedTags.map((tag) => (
                  <span
                    key={`req-${tag}`}
                    className="text-sm px-2.5 py-1 rounded bg-slate-700 text-slate-300 border border-slate-600/50"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
            {(completionTags.length > 0 || ratingImg) && (
              <div className="flex items-center flex-wrap gap-1">
                {ratingImg}
                {completionTags.map((tag) => (
                  <span
                    key={`comp-${tag}`}
                    className="text-sm px-2.5 py-1 rounded"
                    style={{ backgroundColor: "rgba(0, 200, 216, 0.1)", color: "#006D7A", border: "1px solid rgba(0, 200, 216, 0.3)" }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0 ml-3">
        <svg
          className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors flex-shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  );
}
