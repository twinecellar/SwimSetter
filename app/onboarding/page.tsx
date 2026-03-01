import { redirect } from "next/navigation";
import { getUserWithRateLimitHandling } from "@/lib/supabase/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { OnboardingForm } from "./OnboardingForm";

export default async function OnboardingPage() {
  const supabase = createSupabaseServerClient();
  const { user, rateLimited } = await getUserWithRateLimitHandling(supabase);

  if (rateLimited) {
    return (
      <div style={{
        minHeight: '100vh', background: 'var(--fog)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px',
      }}>
        <p style={{
          fontFamily: 'var(--font-dm-sans)',
          fontSize: '14px', color: 'var(--coral)', textAlign: 'center',
        }}>
          Too many auth requests right now. Wait about a minute, then refresh.
        </p>
      </div>
    );
  }

  if (!user) {
    redirect("/auth");
  }

  return <OnboardingForm />;
}
