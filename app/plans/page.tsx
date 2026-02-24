import Link from "next/link";
import { redirect } from "next/navigation";
import { HistoryList } from "@/app/components/HistoryList";
import { PlanCard } from "@/app/components/PlanCard";
import type { CompletionRow, PlanRow } from "@/lib/plan-types";
import { completionByPlanId } from "@/lib/plan-utils";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function PlansPage() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    redirect("/onboarding");
  }

  const [{ data: plans }, { data: completions }] = await Promise.all([
    supabase
      .from("plans")
      .select("*")
      .eq("user_id", user.id)
      .in("status", ["accepted", "completed"])
      .order("created_at", { ascending: false }),
    supabase
      .from("plan_completions")
      .select("*")
      .eq("user_id", user.id)
      .order("completed_at", { ascending: false })
      .limit(50),
  ]);

  const typedPlans = (plans ?? []) as unknown as PlanRow[];
  const typedCompletions = (completions ?? []) as unknown as CompletionRow[];
  const completionsMap = completionByPlanId(typedCompletions);
  const currentPlan = typedPlans.find((plan) => plan.status === "accepted") ?? null;
  const historyPlans = currentPlan
    ? typedPlans.filter((plan) => plan.id !== currentPlan.id)
    : typedPlans;

  if (!typedPlans.length) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">Session history</h2>
        <p className="text-sm text-slate-400">No accepted or completed sessions yet.</p>
        <Link
          href="/plans/generate"
          className="inline-flex items-center rounded-md bg-sky-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-sky-400"
        >
          Generate your first session
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-baseline justify-between gap-2">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Session history</h2>
          <p className="mt-1 text-sm text-slate-400">
            Review recent sessions and jump back into your current one.
          </p>
        </div>
        <Link href="/plans/generate" className="text-sm font-medium text-sky-400 hover:text-sky-300">
          Generate new
        </Link>
      </div>

      {currentPlan && (
        <section className="space-y-2">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Current session</h3>
          <PlanCard
            title="Current Session"
            request={currentPlan.request}
            plan={currentPlan.plan}
            createdAt={currentPlan.created_at}
            status="planned"
            actions={
              <Link
                href={`/plans/${currentPlan.id}/complete`}
                className="inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium"
                style={{
                  backgroundColor: "#f59e0b",
                  borderColor: "#f59e0b",
                  color: "#111827",
                }}
              >
                Finish
              </Link>
            }
          />
        </section>
      )}

      <section className="space-y-2">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">All sessions</h3>
        {historyPlans.length > 0 ? (
          <HistoryList plans={historyPlans} completionsByPlanId={completionsMap} />
        ) : (
          <p className="text-sm text-slate-400">No past sessions yet.</p>
        )}
      </section>
    </div>
  );
}
