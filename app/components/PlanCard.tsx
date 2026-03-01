import type { CompletionRow, Effort, GeneratedPlan, PlanRequest } from "@/lib/plan-types";
import { effortPillStyle } from "@/lib/effort-colors";
import { SessionStatusBadge } from "@/app/components/SessionStatusBadge";
import { PlanBreakdown } from "@/app/components/PlanBreakdown";

interface PlanCardProps {
  title: React.ReactNode;
  request?: PlanRequest;
  plan: Pick<GeneratedPlan, "duration_minutes" | "estimated_distance_m" | "segments">;
  status?: "planned" | "in_progress" | "completed";
  completion?: CompletionRow;
  actions?: React.ReactNode;
}

export function PlanCard({
  title,
  request,
  plan,
  status,
  completion,
  actions,
}: PlanCardProps) {
  const totalDistanceM =
    plan.segments.reduce((sum, segment) => sum + segment.distance_m, 0) || plan.estimated_distance_m;
  const feedbackThumb =
    completion?.rating === 1
      ? <img src="/thumb_up.png" alt="thumbs up" width={16} height={16} style={{ display: "inline-block" }} />
      : completion?.rating === 0
        ? <img src="/thumb_down.png" alt="thumbs down" width={16} height={16} style={{ display: "inline-block" }} />
        : null;

  const requestTokenStyle = {
    backgroundColor: "rgba(0, 200, 216, 0.08)",
    borderColor: "rgba(0, 200, 216, 0.25)",
    color: "#006D7A",
  };

  const feedbackTokenStyle = {
    backgroundColor: "rgba(16, 185, 129, 0.08)",
    borderColor: "rgba(16, 185, 129, 0.25)",
    color: "#047857",
  };

  return (
    <section className="space-y-3 rounded-lg border border-slate-800 bg-slate-900/40 p-4 shadow">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-slate-100">{title}</p>
          <p className="mt-1 text-xs text-slate-400">~{totalDistanceM}m planned</p>
        </div>
        {status && <SessionStatusBadge status={status} />}
      </div>

      {request && (
        <div className="flex flex-wrap gap-2">
          <span
            className="rounded-full border px-3 py-1 text-xs font-medium"
            style={requestTokenStyle}
          >
            {request.duration_minutes} min
          </span>
          <span
            className="rounded-full border px-3 py-1 text-xs font-medium capitalize"
            style={effortPillStyle(request.effort as Effort)}
          >
            {request.effort}
          </span>
          {(request.requested_tags ?? []).slice(0, 5).map((tag) => (
            <span
              key={tag}
              className="rounded-full border px-3 py-1 text-xs font-medium"
              style={requestTokenStyle}
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <PlanBreakdown segments={plan.segments} />

      {completion && (
        <div className="flex flex-wrap gap-2">
          {feedbackThumb && (
            <span
              className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium"
              style={feedbackTokenStyle}
            >
              {feedbackThumb}
            </span>
          )}
          {completion.tags.slice(0, 5).map((tag) => (
            <span
              key={tag}
              className="rounded-full border px-3 py-1 text-xs font-medium"
              style={feedbackTokenStyle}
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </section>
  );
}
