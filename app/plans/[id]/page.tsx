import Link from "next/link";
import { redirect } from "next/navigation";
import type { CompletionRow, PlanRow } from "@/lib/plan-types";
import { PlanBreakdown } from "@/app/components/PlanBreakdown";
import { getUserWithRateLimitHandling } from "@/lib/supabase/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function PlanDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createSupabaseServerClient();
  const { user, rateLimited } = await getUserWithRateLimitHandling(supabase);

  if (rateLimited) {
    return (
      <div className="space-y-3 rounded-lg border border-slate-700 bg-slate-900/40 p-4">
        <p className="text-sm text-slate-300">
          Too many auth requests right now. Wait about a minute, then refresh.
        </p>
      </div>
    );
  }

  if (!user) {
    redirect("/auth");
  }

  const [{ data: plan }, { data: completion }] = await Promise.all([
    supabase
      .from("plans")
      .select("*")
      .eq("id", params.id)
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("plan_completions")
      .select("*")
      .eq("plan_id", params.id)
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  if (!plan) {
    redirect("/plans");
  }

  const typedPlan = plan as unknown as PlanRow;
  const typedCompletion = completion as unknown as CompletionRow | null;

  const date = new Date(typedPlan.created_at).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const distance =
    typedPlan.plan.segments.reduce((sum, s) => sum + s.distance_m, 0) ||
    typedPlan.plan.estimated_distance_m;

  const ratingImg =
    typedCompletion?.rating === 1
      ? <img src="/thumb_up.png" alt="thumbs up" width={16} height={16} style={{ display: "inline-block" }} />
      : typedCompletion?.rating === 0
        ? <img src="/thumb_down.png" alt="thumbs down" width={16} height={16} style={{ display: "inline-block" }} />
        : null;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Link
          href="/plans"
          prefetch={false}
          className="mt-1 text-slate-400 hover:text-slate-200 transition-colors flex-shrink-0"
          aria-label="Back to sessions"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-slate-100">{date}</h2>
          <p className="mt-1 text-sm text-slate-400">
            {distance.toLocaleString()}m · {typedPlan.plan.duration_minutes} min
          </p>
        </div>
      </div>

      {/* Session inputs */}
      {typedPlan.request && (
        <section className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Session inputs
          </h3>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-xs font-medium text-slate-300">
              {typedPlan.request.duration_minutes} min
            </span>
            <span className="rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-xs font-medium capitalize text-slate-300">
              {typedPlan.request.effort}
            </span>
            {(typedPlan.request.requested_tags ?? []).map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-xs font-medium text-slate-300"
              >
                {tag}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Plan breakdown */}
      <section className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Plan</h3>
        <PlanBreakdown segments={typedPlan.plan.segments} />
      </section>

      {/* Feedback */}
      <section className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Your feedback
        </h3>
        {typedCompletion ? (
          <div className="space-y-2">
            {(ratingImg || typedCompletion.tags.length > 0) && (
              <div className="flex flex-wrap gap-2 items-center">
                {ratingImg && (
                  <span className="inline-flex items-center rounded-full border border-slate-700 bg-slate-800 px-3 py-1">
                    {ratingImg}
                  </span>
                )}
                {typedCompletion.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-xs font-medium text-slate-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
            {typedCompletion.notes && (
              <p className="rounded-md border border-slate-800 bg-slate-900/50 px-3 py-2 text-sm text-slate-300">
                {typedCompletion.notes}
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-slate-500">No feedback recorded.</p>
        )}
      </section>
    </div>
  );
}
