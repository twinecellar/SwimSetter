import Link from "next/link";
import { redirect } from "next/navigation";
import { PlanCard } from "@/app/components/PlanCard";
import { HistoryList } from "@/app/components/HistoryList";
import type { CompletionRow, PlanRow } from "@/lib/plan-types";
import { completionByPlanId } from "@/lib/plan-utils";
import { getUserWithRateLimitHandling } from "@/lib/supabase/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function HomePage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const supabase = createSupabaseServerClient();
  const { user, rateLimited } = await getUserWithRateLimitHandling(supabase);

  if (rateLimited) {
    return (
      <div className="space-y-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
        <h2 className="text-xl font-semibold tracking-tight">Home</h2>
        <p className="text-sm text-amber-200">
          Too many auth requests right now. Wait about a minute, then refresh.
        </p>
      </div>
    );
  }

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
  const completedPlans = typedPlans.filter((plan) => plan.status === "completed");

  const currentPlan = typedPlans.find((plan) => plan.status === "accepted") ?? null;
  const latestCompletedPlan = typedPlans.find((plan) => plan.status === "completed") ?? null;

  const returnedFromCompletion = searchParams?.return === "completion";

  const sessionState = currentPlan
    ? "planned_session"
    : latestCompletedPlan
      ? "completed_session"
      : "no_session";

  return (
    <div className="space-y-6">

      {currentPlan && (
        <PlanCard
          title={
            <span className="flex items-center gap-2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-sky-400" style={{ flexShrink: 0 }}>
                <path d="M13.7007 11.0181L18.2393 8.39775C18.6198 8.17808 19.1063 8.30844 19.326 8.68892L19.4227 8.85641C20.0482 9.93988 20.0715 11.2692 19.4842 12.3739C18.7688 13.7197 17.1343 14.283 15.7416 13.6637L13.7944 12.7979C13.0476 12.4658 12.9929 11.4268 13.7007 11.0181Z" stroke="currentColor"/>
                <path d="M12 13.9638V19.2045C12 19.6438 11.6438 20 11.2045 20H11.0111C9.76002 20 8.59719 19.3555 7.93412 18.2946C7.12631 17.0021 7.45569 15.305 8.68835 14.4085L10.4118 13.155C11.0728 12.6743 12 13.1465 12 13.9638Z" stroke="currentColor"/>
                <path d="M13.7007 12.9818L18.2393 15.6022C18.6198 15.8218 18.7501 16.3083 18.5305 16.6888L18.4338 16.8563C17.8082 17.9398 16.6687 18.6246 15.4183 18.6684C13.8951 18.7217 12.59 17.5879 12.43 16.0721L12.2062 13.9528C12.1204 13.1401 12.9929 12.5731 13.7007 12.9818Z" stroke="currentColor"/>
                <path d="M10.2993 12.9819L5.7607 15.6023C5.38022 15.8219 4.8937 15.6916 4.67403 15.3111L4.57733 15.1436C3.95179 14.0601 3.92852 12.7308 4.51577 11.6261C5.2312 10.2803 6.86566 9.71699 8.25835 10.3363L10.2056 11.2021C10.9524 11.5342 11.0071 12.5732 10.2993 12.9819Z" stroke="currentColor"/>
                <path d="M10.2991 11.018L5.76045 8.39766C5.37997 8.17799 5.24961 7.69147 5.46928 7.31099L5.56598 7.1435C6.19152 6.06003 7.33109 5.37524 8.58141 5.33146C10.1046 5.27812 11.4097 6.41195 11.5698 7.9277L11.7935 10.047C11.8794 10.8598 11.0069 11.4267 10.2991 11.018Z" stroke="currentColor"/>
                <path d="M12 10.0362V4.79549C12 4.35616 12.3562 4 12.7955 4H12.9889C14.24 4 15.4028 4.6445 16.0659 5.70541C16.8737 6.99791 16.5443 8.69505 15.3117 9.59153L13.5882 10.845C12.9272 11.3257 12 10.8535 12 10.0362Z" stroke="currentColor"/>
              </svg>
              <span className="text-base font-bold tracking-tight text-slate-100">In Progress</span>
            </span>
          }
          request={currentPlan.request}
          plan={currentPlan.plan}
          status={returnedFromCompletion ? "in_progress" : undefined}
          actions={
            <Link
              href={`/plans/${currentPlan.id}/complete`}
              prefetch={false}
              className="inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium"
              style={{
                backgroundColor: "#10b981",
                borderColor: "#10b981",
                color: "#111827",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ marginRight: "6px", flexShrink: 0 }}>
                <path d="M16.5 20.5H7.5" stroke="currentColor" strokeLinecap="round"/>
                <path d="M12.5 18.5C12.5 18.7761 12.2761 19 12 19C11.7239 19 11.5 18.7761 11.5 18.5H12.5ZM11.5 18.5V16H12.5V18.5H11.5Z" fill="currentColor"/>
                <path d="M10.5 9.5H13.5" stroke="currentColor" strokeLinecap="round"/>
                <path d="M5.5 14.5C5.5 14.5 3.5 13 3.5 10.5C3.5 9.73465 3.5 9.06302 3.5 8.49945C3.5 7.39488 4.39543 6.5 5.5 6.5C6.60457 6.5 7.5 7.39543 7.5 8.5V9.5" stroke="currentColor" strokeLinecap="round"/>
                <path d="M18.5 14.5C18.5 14.5 20.5 13 20.5 10.5C20.5 9.73465 20.5 9.06302 20.5 8.49945C20.5 7.39488 19.6046 6.5 18.5 6.5C17.3954 6.5 16.5 7.39543 16.5 8.5V9.5" stroke="currentColor" strokeLinecap="round"/>
                <path d="M16.5 11.3593V7.5C16.5 6.39543 15.6046 5.5 14.5 5.5H9.5C8.39543 5.5 7.5 6.39543 7.5 7.5V11.3593C7.5 12.6967 8.16841 13.9456 9.2812 14.6875L11.4453 16.1302C11.7812 16.3541 12.2188 16.3541 12.5547 16.1302L14.7188 14.6875C15.8316 13.9456 16.5 12.6967 16.5 11.3593Z" stroke="currentColor"/>
              </svg>
              {returnedFromCompletion ? "Continue completion" : "Finish"}
            </Link>
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
            prefetch={false}
            className="inline-flex items-center rounded-md bg-sky-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-sky-400"
          >
            Generate your first session
          </Link>
        </section>
      )}

      {completedPlans.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-lg font-semibold tracking-tight text-slate-100">Recent sessions</h3>
            <Link
              href="/plans"
              prefetch={false}
              className="text-sm font-medium text-sky-400 hover:text-sky-300"
            >
              View all
            </Link>
          </div>
          <HistoryList plans={completedPlans} completionsByPlanId={completionsMap} limit={5} />
        </section>
      )}
    </div>
  );
}
