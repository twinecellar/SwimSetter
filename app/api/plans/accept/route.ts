import { NextResponse } from "next/server";
import { getUserWithRateLimitHandling } from "@/lib/supabase/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { normalizeRequestedTags } from "@/lib/request-options";

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
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "request body must be a JSON object" }, { status: 400 });
  }

  const { request: reqPayload, plan } = body as {
    request: any;
    plan: any;
  };

  if (!reqPayload || typeof reqPayload !== "object") {
    return NextResponse.json({ error: "request payload is required" }, { status: 400 });
  }

  if (Object.prototype.hasOwnProperty.call(reqPayload, "fun_mode")) {
    return NextResponse.json({ error: "fun_mode is no longer supported" }, { status: 400 });
  }

  const normalizedRequest = {
    ...reqPayload,
    requested_tags: normalizeRequestedTags(reqPayload.requested_tags),
  };

  const { data, error } = await supabase
    .from("plans")
    .insert({
      user_id: user.id,
      status: "accepted",
      request: normalizedRequest,
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
