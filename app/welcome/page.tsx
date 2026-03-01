import { redirect } from "next/navigation";
import { getUserWithRateLimitHandling } from "@/lib/supabase/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { WelcomeReveal } from "./WelcomeReveal";
import type { GobySpecies } from "@/lib/gobies";

export default async function WelcomePage() {
  const supabase = createSupabaseServerClient();
  const { user, rateLimited } = await getUserWithRateLimitHandling(supabase);

  if (rateLimited || !user) {
    redirect("/auth");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("goby_species")
    .eq("id", user.id)
    .maybeSingle();

  const species = (profile?.goby_species as GobySpecies | null) ?? null;

  if (!species) {
    redirect("/");
  }

  return <WelcomeReveal species={species} />;
}
