import { NextResponse } from "next/server";
import { getUserWithRateLimitHandling } from "@/lib/supabase/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

interface CompleteBody {
  rating?: 0 | 1 | null;
  tags?: string[];
  notes?: string | null;
}

export async function POST(
  request: Request,
  context: { params: { id: string } },
) {
  const supabase = createSupabaseServerClient();
  const { user, rateLimited } = await getUserWithRateLimitHandling(supabase);

  if (rateLimited) {
    return NextResponse.json(
      { error: "Too many auth requests", code: "OVER_REQUEST_RATE_LIMIT" },
      { status: 429 },
    );
  }

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const planId = context.params.id;
  const body = (await request.json()) as CompleteBody;
  const rating = body.rating ?? null;

  if (rating !== null && rating !== 0 && rating !== 1) {
    return NextResponse.json(
      { error: "Rating must be 0 (thumbs down) or 1 (thumbs up)." },
      { status: 400 },
    );
  }

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
      rating,
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
