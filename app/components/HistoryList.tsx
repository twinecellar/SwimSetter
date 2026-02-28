import type { CompletionRow, PlanRow } from "@/lib/plan-types";
import { SessionRow } from "@/app/components/SessionRow";

interface HistoryListProps {
  plans: PlanRow[];
  completionsByPlanId: Record<string, CompletionRow>;
  limit?: number;
}

export function HistoryList({
  plans,
  completionsByPlanId,
  limit,
}: HistoryListProps) {
  const rows = typeof limit === "number" ? plans.slice(0, limit) : plans;

  return (
    <div className="divide-y divide-slate-800">
      {rows.map((plan) => {
        const completion = completionsByPlanId[plan.id];
        return (
          <SessionRow key={plan.id} plan={plan} completion={completion} />
        );
      })}
    </div>
  );
}
