import type { CompletionRow, GeneratedPlan, PlanRequest } from "@/lib/plan-types";
import { SessionStatusBadge } from "@/app/components/SessionStatusBadge";

interface PlanCardProps {
  title: string;
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
  const firstSegment = plan.segments[0];
  const feedbackSymbol =
    completion?.rating === 0 ? "👎" : completion?.rating === 1 ? "👍" : "No feedback";

  const requestTokenStyle = {
    backgroundColor: "#0b1736",
    borderColor: "#1e3a5f",
    color: "#c7d8ee",
  };

  const feedbackTokenStyle = {
    backgroundColor: "#132b1f",
    borderColor: "#1f5d46",
    color: "#b6efd2",
  };

  return (
    <section className="space-y-3 rounded-lg border border-slate-800 bg-slate-900/40 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-slate-100">{title}</p>
          <p className="mt-1 text-xs text-slate-400">~{plan.estimated_distance_m}m planned</p>
        </div>
        {status && <SessionStatusBadge status={status} />}
      </div>

      {request && (
        <div className="space-y-1">
          <div className="flex flex-wrap gap-2">
            <span
              className="rounded-full border px-3 py-1 text-xs font-medium"
              style={requestTokenStyle}
            >
              {request.duration_minutes} min
            </span>
            <span
              className="rounded-full border px-3 py-1 text-xs font-medium capitalize"
              style={requestTokenStyle}
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
        </div>
      )}

      {firstSegment && <p className="text-sm text-slate-200">{firstSegment.description}</p>}

      {completion && (
        <div className="space-y-1">
          <div className="flex flex-wrap gap-2">
            <span
              className="rounded-full border px-3 py-1 text-xs font-medium"
              style={feedbackTokenStyle}
            >
              {feedbackSymbol}
            </span>
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
        </div>
      )}

      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </section>
  );
}
