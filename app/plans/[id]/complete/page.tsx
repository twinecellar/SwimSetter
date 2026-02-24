import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CompletionForm } from "./CompletionForm";

interface PlanRow {
  id: string;
  created_at: string;
  status: "accepted" | "completed";
  plan: {
    segments: {
      id: string;
      description: string;
    }[];
  };
}

export default async function CompletePlanPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  const { data: plan } = await supabase
    .from("plans")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();

  if (!plan) {
    redirect("/plans");
  }

  const typedPlan = plan as unknown as PlanRow;
  const firstSegment = typedPlan.plan.segments?.[0];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">
          How was this session?
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          Add a quick rating and a few tags so future plans can avoid repetition
          and lean into what you like.
        </p>
      </div>

      {firstSegment && (
        <div className="rounded-md border border-slate-800 bg-slate-900/40 p-3 text-sm">
          <p className="text-xs uppercase tracking-wide text-slate-400">
            Plan preview
          </p>
          <p className="mt-1 text-slate-100">{firstSegment.description}</p>
        </div>
      )}

      <CompletionForm planId={typedPlan.id} />
    </div>
  );
}

