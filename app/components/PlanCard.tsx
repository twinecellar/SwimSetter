import type { CompletionRow, GeneratedPlan, PlanRequest } from "@/lib/plan-types";
import { formatSessionDate } from "@/lib/plan-utils";
import { SessionStatusBadge } from "@/app/components/SessionStatusBadge";

interface PlanCardProps {
  title: string;
  request?: PlanRequest;
  plan: Pick<GeneratedPlan, "duration_minutes" | "estimated_distance_m" | "segments">;
  createdAt?: string;
  status?: "planned" | "in_progress" | "completed";
  completion?: CompletionRow;
  actions?: React.ReactNode;
}

export function PlanCard({
  title,
  request,
  plan,
  createdAt,
  status,
  completion,
  actions,
}: PlanCardProps) {
  const firstSegment = plan.segments[0];

  return (
    <section className="space-y-3 rounded-lg border border-slate-800 bg-slate-900/40 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-slate-100">{title}</p>
          <p className="mt-1 text-xs text-slate-400">
            ~{plan.estimated_distance_m}m · {plan.duration_minutes} min
            {request
              ? ` · ${request.effort} · ${request.fun_mode}`
              : ""}
          </p>
          {createdAt && (
            <p className="mt-1 text-xs text-slate-500">{formatSessionDate(createdAt)}</p>
          )}
        </div>
        {status && <SessionStatusBadge status={status} />}
      </div>

      {firstSegment && <p className="text-sm text-slate-200">{firstSegment.description}</p>}

      {completion && (
        <p className="text-xs text-slate-400">
          {completion.rating ? `Rating ${completion.rating}/5` : "No rating"}
          {completion.tags.length > 0 ? ` · ${completion.tags.slice(0, 3).join(", ")}` : ""}
        </p>
      )}

      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </section>
  );
}
