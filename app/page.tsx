import Link from "next/link";
import { redirect } from "next/navigation";
import { PlanCard } from "@/app/components/PlanCard";
import { HistoryList } from "@/app/components/HistoryList";
import { SessionStatusBadge } from "@/app/components/SessionStatusBadge";
import type { CompletionRow, PlanRow } from "@/lib/plan-types";
import { completionByPlanId } from "@/lib/plan-utils";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function HomePage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
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
      .order("created_at", { ascending: false })
      .limit(20),
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
  const latestCompletedPlan = typedPlans.find((plan) => plan.status === "completed") ?? null;

  const justCompleted = searchParams?.just_completed === "1";
  const returnedFromCompletion = searchParams?.return === "completion";

  const sessionState = currentPlan
    ? "planned_session"
    : latestCompletedPlan
      ? "completed_session"
      : "no_session";

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Home</h2>
          <p className="mt-1 text-sm text-slate-400">
            {sessionState === "planned_session"
              ? "You have a current session ready to complete."
              : sessionState === "completed_session"
                ? "Latest session complete. Keep momentum with the next one."
                : "Generate your first session and get in the pool."}
          </p>
        </div>
        <SessionStatusBadge
          status={
            sessionState === "planned_session"
              ? returnedFromCompletion
                ? "in_progress"
                : "planned"
              : sessionState === "completed_session"
                ? "completed"
                : "planned"
          }
        />
      </section>

      {justCompleted && (
        <p className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
          Session saved. Generate your next session when you are ready.
        </p>
      )}

      {currentPlan && (
        <PlanCard
          title="Current Session"
          request={currentPlan.request}
          plan={currentPlan.plan}
          createdAt={currentPlan.created_at}
          status={returnedFromCompletion ? "in_progress" : "planned"}
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
              {returnedFromCompletion ? "Continue completion" : "Finish"}
            </Link>
          }
        />
      )}

      {!currentPlan && latestCompletedPlan && (
        <PlanCard
          title="Latest Session"
          request={latestCompletedPlan.request}
          plan={latestCompletedPlan.plan}
          createdAt={latestCompletedPlan.created_at}
          status="completed"
          completion={completionsMap[latestCompletedPlan.id]}
          actions={
            <>
              <Link
                href="/plans/generate?from=home"
                className="inline-flex items-center rounded-md bg-sky-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-sky-400"
              >
                Generate next session
              </Link>
              <Link
                href="/plans"
                className="inline-flex items-center rounded-md border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 hover:border-slate-500"
              >
                View history
              </Link>
            </>
          }
        />
      )}

      {sessionState === "no_session" && (
        <section className="space-y-3 rounded-lg border border-slate-800 bg-slate-900/40 p-4">
          <h3 className="text-lg font-semibold text-slate-100">No sessions yet</h3>
          <p className="text-sm text-slate-400">
            Generate your first session to start your swim cycle.
          </p>
          <Link
            href="/plans/generate?from=home"
            className="inline-flex items-center rounded-md bg-sky-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-sky-400"
          >
            Generate your first session
          </Link>
        </section>
      )}

      {typedPlans.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-lg font-semibold tracking-tight text-slate-100">Recent sessions</h3>
            <Link href="/plans" className="text-sm font-medium text-sky-400 hover:text-sky-300">
              View all
            </Link>
          </div>
          <HistoryList plans={typedPlans} completionsByPlanId={completionsMap} limit={5} />
        </section>
      )}
    </div>
  );
}
