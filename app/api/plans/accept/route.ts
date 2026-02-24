import { NextResponse } from "next/server";
import { getUserWithRateLimitHandling } from "@/lib/supabase/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
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

  const body = await request.json();

  const { request: reqPayload, plan } = body as {
    request: any;
    plan: any;
  };

  const { data, error } = await supabase
    .from("plans")
    .insert({
      user_id: user.id,
      status: "accepted",
      request: reqPayload,
      plan,
      generator_version: "v1",
    })
    .select("*")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ plan: data });
}
