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
  const firstTag = completion?.tags?.[0];

  return (
    <Link
      href={`/plans/${plan.id}`}
      prefetch={false}
      className="flex items-center justify-between py-3 -mx-1 px-1 rounded hover:bg-slate-800/40 transition-colors group"
    >
      <div>
        <p className="text-sm font-medium text-slate-100">{date}</p>
        <p className="text-xs text-slate-400 mt-0.5">{distance.toLocaleString()}m</p>
      </div>
      <div className="flex items-center gap-2">
        {ratingImg}
        {firstTag && <span className="text-xs text-slate-400">{firstTag}</span>}
        {!ratingImg && !firstTag && <span className="text-xs text-slate-600">—</span>}
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
