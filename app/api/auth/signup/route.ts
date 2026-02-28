import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { inviteToken } = body as { inviteToken?: string };

  if (!inviteToken) {
    return NextResponse.json({ error: "inviteToken is required." }, { status: 400 });
  }

  const supabase = createSupabaseServerClient();

  const { data: valid, error } = await supabase.rpc("consume_invite_token", {
    p_token: inviteToken,
  });

  if (error) {
    console.error("consume_invite_token error:", error);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }

  if (!valid) {
    return NextResponse.json(
      { error: "Invalid or already-used invite link." },
      { status: 400 },
    );
  }

  return NextResponse.json({ ok: true });
}
