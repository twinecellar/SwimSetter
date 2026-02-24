import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

interface CompleteBody {
  rating?: number | null;
  tags?: string[];
  notes?: string | null;
}

export async function POST(
  request: Request,
  context: { params: { id: string } },
) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const planId = context.params.id;
  const body = (await request.json()) as CompleteBody;

  const { data: existingPlan, error: planError } = await supabase
    .from("plans")
    .select("*")
    .eq("id", planId)
    .maybeSingle();

  if (planError || !existingPlan) {
    return NextResponse.json(
      { error: "Plan not found" },
      { status: 404 },
    );
  }

  const { data: completion, error: completionError } = await supabase
    .from("plan_completions")
    .insert({
      plan_id: planId,
      user_id: user.id,
      rating: body.rating ?? null,
      tags: body.tags ?? [],
      notes: body.notes ?? null,
    })
    .select("*")
    .maybeSingle();

  if (completionError) {
    return NextResponse.json(
      { error: completionError.message },
      { status: 400 },
    );
  }

  const { error: updateError } = await supabase
    .from("plans")
    .update({ status: "completed" })
    .eq("id", planId);

  if (updateError) {
    return NextResponse.json(
      { error: updateError.message },
      { status: 400 },
    );
  }

  return NextResponse.json({ completion });
}

