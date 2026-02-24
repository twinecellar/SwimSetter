import Link from "next/link";
import type { CompletionRow, PlanRow } from "@/lib/plan-types";
import { PlanCard } from "@/app/components/PlanCard";

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
    <div className="space-y-3">
      {rows.map((plan) => {
        const completion = completionsByPlanId[plan.id];

        return (
          <PlanCard
            key={plan.id}
            title={`${plan.status === "accepted" ? "Planned" : "Completed"} session`}
            request={plan.request}
            plan={plan.plan}
            createdAt={plan.created_at}
            status={plan.status === "completed" ? "completed" : "planned"}
            completion={completion}
            actions={
              plan.status === "completed" ? (
                <Link
                  href={`/plans/${plan.id}/complete`}
                  className="inline-flex items-center rounded-md border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-200 hover:border-sky-500 hover:text-sky-300"
                >
                  Rate session
                </Link>
              ) : (
                <Link
                  href={`/plans/${plan.id}/complete`}
                  className="inline-flex items-center rounded-md border px-3 py-1.5 text-xs font-medium"
                  style={{
                    backgroundColor: "#f59e0b",
                    borderColor: "#f59e0b",
                    color: "#111827",
                  }}
                >
                  Finish
                </Link>
              )
            }
          />
        );
      })}
    </div>
  );
}
