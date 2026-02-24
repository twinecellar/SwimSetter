import { redirect } from "next/navigation";
import { CompletionForm } from "./CompletionForm";
import { PlanCard } from "@/app/components/PlanCard";
import type { PlanRow } from "@/lib/plan-types";
import { getUserWithRateLimitHandling } from "@/lib/supabase/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function CompletePlanPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createSupabaseServerClient();
  const { user, rateLimited } = await getUserWithRateLimitHandling(supabase);

  if (rateLimited) {
    return (
      <div className="space-y-3 rounded-lg border border-slate-700 bg-slate-900/40 p-4">
        <h2 className="text-xl font-semibold tracking-tight">Rate Session</h2>
        <p className="text-sm text-slate-300">
          Too many auth requests right now. Wait about a minute, then refresh.
        </p>
      </div>
    );
  }

  if (!user) {
    redirect("/auth");
  }

  const { data: plan } = await supabase
    .from("plans")
    .select("*")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!plan) {
    redirect("/plans");
  }

  const typedPlan = plan as unknown as PlanRow;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Rate Session</h2>
        <p className="mt-1 text-sm text-slate-400">
          Rate this session quickly, add tags, and include notes only if useful.
        </p>
      </div>

      <PlanCard
        title="Session recap"
        request={typedPlan.request}
        plan={typedPlan.plan}
        createdAt={typedPlan.created_at}
        status={typedPlan.status === "completed" ? "completed" : "in_progress"}
      />

      <CompletionForm planId={typedPlan.id} />
    </div>
  );
}
