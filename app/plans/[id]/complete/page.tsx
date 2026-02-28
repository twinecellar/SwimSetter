import { redirect } from "next/navigation";
import { CompletionForm } from "./CompletionForm";
import { effortPillStyle } from "@/lib/effort-colors";
import type { Effort, PlanRow } from "@/lib/plan-types";
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
        <h2 className="text-xl font-semibold tracking-tight">Session Feedback</h2>
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
    <CompletionForm planId={typedPlan.id}>
      <section className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-slate-100">
            {typedPlan.request.duration_minutes} min session
          </p>
          <span className="text-xs text-slate-400">
            ~{typedPlan.plan.segments.reduce((sum, s) => sum + s.distance_m, 0) || typedPlan.plan.estimated_distance_m}m
          </span>
        </div>
        <div className="mt-2.5 flex flex-wrap gap-2">
          <span
            className="rounded-full border px-3 py-1 text-xs font-medium capitalize"
            style={effortPillStyle(typedPlan.request.effort as Effort)}
          >
            {typedPlan.request.effort}
          </span>
          {(typedPlan.request.requested_tags ?? []).slice(0, 5).map((tag) => (
            <span
              key={tag}
              className="rounded-full border px-3 py-1 text-xs font-medium"
              style={{
                backgroundColor: "rgba(14, 165, 233, 0.08)",
                borderColor: "rgba(14, 165, 233, 0.25)",
                color: "#0369a1",
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      </section>
    </CompletionForm>
  );
}
