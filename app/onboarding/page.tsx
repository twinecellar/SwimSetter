import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { OnboardingForm } from "./OnboardingForm";

export default async function OnboardingPage() {
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

  const initialLevel =
    (profile?.swim_level as "beginner" | "intermediate" | "advanced") ??
    "beginner";

  return (
    <div className="mx-auto max-w-md">
      <OnboardingForm initialLevel={initialLevel} />
    </div>
  );
}

