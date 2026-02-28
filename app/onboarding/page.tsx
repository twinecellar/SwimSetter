import { redirect } from "next/navigation";
import { getUserWithRateLimitHandling } from "@/lib/supabase/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { OnboardingForm } from "./OnboardingForm";

export default async function OnboardingPage() {
  const supabase = createSupabaseServerClient();
  const { user, rateLimited } = await getUserWithRateLimitHandling(supabase);

  if (rateLimited) {
    return (
      <div className="mx-auto max-w-md space-y-3 rounded-lg border border-slate-700 bg-slate-900/40 p-4">
        <h2 className="text-xl font-semibold tracking-tight">Onboarding</h2>
        <p className="text-sm text-slate-300">
          Too many auth requests right now. Wait about a minute, then refresh.
        </p>
      </div>
    );
  }

  if (!user) {
    redirect("/auth");
  }

  return (
    <div className="mx-auto max-w-md">
      <OnboardingForm />
    </div>
  );
}
