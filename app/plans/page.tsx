import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import Link from "next/link";

interface PlanRow {
  id: string;
  created_at: string;
  status: "accepted" | "completed";
  request: {
    duration_minutes: number;
    effort: string;
    fun_mode: string;
  };
  plan: {
    segments: {
      id: string;
      description: string;
    }[];
  };
}

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

  const { data: plans } = await supabase
    .from("plans")
    .select("*")
    .eq("user_id", user.id)
    .in("status", ["accepted", "completed"])
    .order("created_at", { ascending: false });

  const typedPlans = (plans ?? []) as unknown as PlanRow[];

  if (!typedPlans.length) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">
          Your swim plans
        </h2>
        <p className="text-sm text-slate-400">
          You haven&apos;t accepted any plans yet.
        </p>
        <Link
          href="/plans/generate"
          className="inline-flex items-center rounded-md bg-sky-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-sky-400"
        >
          Generate your first plan
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between gap-2">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">
            Your swim plans
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Accepted and completed sessions, most recent first.
          </p>
        </div>
        <Link
          href="/plans/generate"
          className="text-sm font-medium text-sky-400 hover:text-sky-300"
        >
          New plan
        </Link>
      </div>

      <div className="space-y-3">
        {typedPlans.map((plan) => {
          const created = new Date(plan.created_at);
          const summary = plan.request;
          const firstSegment = plan.plan.segments?.[0];

          return (
            <div
              key={plan.id}
              className="space-y-2 rounded-md border border-slate-800 bg-slate-900/40 p-3 text-sm"
            >
              <div className="flex items-baseline justify-between gap-2">
                <div>
                  <p className="font-medium text-slate-100">
                    {summary.duration_minutes} min · {summary.effort} ·{" "}
                    {summary.fun_mode}
                  </p>
                  <p className="text-xs text-slate-400">
                    {created.toLocaleDateString()} ·{" "}
                    {created.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    plan.status === "completed"
                      ? "bg-emerald-500/10 text-emerald-300"
                      : "bg-sky-500/10 text-sky-300"
                  }`}
                >
                  {plan.status}
                </span>
              </div>

              {firstSegment && (
                <p className="text-slate-200">
                  <span className="text-xs uppercase tracking-wide text-slate-400">
                    Preview:{" "}
                  </span>
                  {firstSegment.description}
                </p>
              )}

              <div className="flex gap-2">
                <Link
                  href={`/plans/${plan.id}/complete`}
                  className="inline-flex items-center rounded-md border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-200 hover:border-sky-500 hover:text-sky-300"
                >
                  {plan.status === "completed"
                    ? "Edit feedback"
                    : "Mark complete / add feedback"}
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

