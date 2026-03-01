import type { CSSProperties } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getUserWithRateLimitHandling } from "@/lib/supabase/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { GOBY_FISH_COMPONENTS, GOBY_PROFILES, type GobySpecies } from "@/lib/gobies";
import { SignOutButton } from "./SignOutButton";
import type { GeneratedPlan } from "@/lib/plan-types";

function formatDistance(metres: number): string {
  if (metres >= 1000) {
    return `${(metres / 1000).toFixed(1).replace(/\.0$/, '')}km`;
  }
  return `${metres}m`;
}

function levelPillStyle(level: string): CSSProperties {
  switch (level) {
    case 'advanced':
      return {
        background: 'var(--water-light)', color: 'var(--water)',
        border: '1.5px solid var(--water)',
      };
    case 'intermediate':
      return {
        background: '#FFF5E6', color: 'var(--coral)',
        border: '1.5px solid var(--coral)',
      };
    default: // beginner
      return {
        background: 'var(--mint-light)', color: 'var(--mint)',
        border: '1.5px solid var(--mint)',
      };
  }
}

export default async function ProfilePage() {
  const supabase = createSupabaseServerClient();
  const { user, rateLimited } = await getUserWithRateLimitHandling(supabase);

  if (rateLimited || !user) {
    redirect("/auth");
  }

  const [
    { data: profile },
    { data: completedPlans },
    { data: completions },
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase
      .from("plans")
      .select("plan")
      .eq("user_id", user.id)
      .eq("status", "completed"),
    supabase
      .from("plan_completions")
      .select("tags")
      .eq("user_id", user.id),
  ]);

  if (!profile) {
    redirect("/onboarding");
  }

  const sessionsCompleted = completions?.length ?? 0;

  const totalDistanceM = (completedPlans ?? []).reduce((sum, row) => {
    const dist = (row.plan as GeneratedPlan | null)?.estimated_distance_m ?? 0;
    return sum + (typeof dist === "number" ? dist : 0);
  }, 0);

  const tagCounts = new Map<string, number>();
  for (const row of completions ?? []) {
    for (const tag of (row.tags as string[] | null) ?? []) {
      tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
    }
  }
  const topTags = [...tagCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([tag]) => tag);

  const species = (profile.goby_species as GobySpecies | null) ?? "neon";
  const gobyProfile = GOBY_PROFILES[species];
  const FishComponent = GOBY_FISH_COMPONENTS[species];
  const swimLevel = (profile.swim_level as string) ?? "beginner";

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--fog)',
      padding: '52px 24px 40px',
    }}>
      <div style={{ maxWidth: '390px', margin: '0 auto' }}>

        {/* Header row */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: '28px',
        }}>
          <h1 style={{
            fontFamily: 'var(--font-fraunces)',
            fontSize: '24px', fontWeight: 600,
            color: 'var(--ink)', margin: 0,
          }}>
            Profile
          </h1>
          <Link
            href="/"
            style={{
              fontFamily: 'var(--font-dm-sans)',
              fontSize: '22px', lineHeight: 1,
              color: 'var(--ink-soft)', opacity: 0.5,
              textDecoration: 'none',
            }}
            aria-label="Close"
          >
            ×
          </Link>
        </div>

        {/* Goby card */}
        <div style={{
          background: 'white', borderRadius: 'var(--radius)',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          padding: '24px', textAlign: 'center',
          marginBottom: '20px',
        }}>
          <FishComponent width={100} height={62} />
          <h2 style={{
            fontFamily: 'var(--font-fraunces)',
            fontSize: '20px', fontWeight: 700,
            color: 'var(--ink)', margin: '12px 0 4px',
          }}>
            {gobyProfile.name}
          </h2>
          <p style={{
            fontFamily: 'var(--font-dm-sans)',
            fontSize: '12px', fontStyle: 'italic',
            color: 'var(--ink-soft)', opacity: 0.4,
            margin: '0 0 12px',
          }}>
            {gobyProfile.species}
          </p>
          {gobyProfile.descriptor && (
            <p style={{
              fontFamily: 'var(--font-dm-sans)',
              fontSize: '13px', color: 'var(--ink-soft)',
              lineHeight: 1.5, margin: 0, textAlign: 'center',
            }}>
              {gobyProfile.descriptor}
            </p>
          )}
          <div style={{
            borderTop: '1px solid var(--fog-dark)',
            margin: '16px 0',
          }} />
          <p style={{
            fontFamily: 'var(--font-dm-sans)',
            fontSize: '12px', fontStyle: 'italic',
            color: 'var(--ink-soft)', opacity: 0.4,
            margin: 0,
          }}>
            Your goby will evolve as you complete more sessions.
          </p>
        </div>

        {/* Swim level pill */}
        <div style={{ marginBottom: '28px' }}>
          <p style={{
            fontFamily: 'var(--font-dm-sans)',
            fontSize: '11px', fontWeight: 600, textTransform: 'uppercase',
            letterSpacing: '0.08em', color: 'var(--ink-soft)', opacity: 0.4,
            margin: '0 0 8px',
          }}>
            Swim level
          </p>
          <span style={{
            display: 'inline-block',
            borderRadius: '100px', padding: '6px 14px',
            fontFamily: 'var(--font-dm-sans)', fontSize: '13px', fontWeight: 600,
            textTransform: 'capitalize',
            ...levelPillStyle(swimLevel),
          }}>
            {swimLevel}
          </span>
        </div>

        {/* Stats */}
        <div style={{
          display: 'flex', gap: '24px',
          marginBottom: '36px',
        }}>
          <div style={{ flex: 1 }}>
            <p style={{
              fontFamily: 'var(--font-dm-sans)',
              fontSize: '11px', fontWeight: 600, textTransform: 'uppercase',
              letterSpacing: '0.08em', color: 'var(--ink-soft)', opacity: 0.4,
              margin: '0 0 4px',
            }}>
              Sessions completed
            </p>
            <p style={{
              fontFamily: 'var(--font-fraunces)',
              fontSize: '22px', fontWeight: 700,
              color: 'var(--ink)', margin: 0,
            }}>
              {sessionsCompleted ?? 0}
            </p>
          </div>
          <div style={{ flex: 1 }}>
            <p style={{
              fontFamily: 'var(--font-dm-sans)',
              fontSize: '11px', fontWeight: 600, textTransform: 'uppercase',
              letterSpacing: '0.08em', color: 'var(--ink-soft)', opacity: 0.4,
              margin: '0 0 4px',
            }}>
              Total distance
            </p>
            <p style={{
              fontFamily: 'var(--font-fraunces)',
              fontSize: '22px', fontWeight: 700,
              color: 'var(--ink)', margin: 0,
            }}>
              {formatDistance(totalDistanceM)}
            </p>
          </div>
        </div>

        {/* Most used tags */}
        {topTags.length > 0 && (
          <div style={{ marginBottom: '36px' }}>
            <p style={{
              fontFamily: 'var(--font-dm-sans)',
              fontSize: '11px', fontWeight: 600, textTransform: 'uppercase',
              letterSpacing: '0.08em', color: 'var(--ink-soft)', opacity: 0.4,
              margin: '0 0 10px',
            }}>
              Most used tags
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {topTags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    display: 'inline-block',
                    background: 'white',
                    border: '1px solid var(--fog-dark)',
                    borderRadius: '100px',
                    padding: '5px 12px',
                    fontFamily: 'var(--font-dm-sans)',
                    fontSize: '13px', fontWeight: 500,
                    color: 'var(--ink-soft)',
                    textTransform: 'capitalize',
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Sign out */}
        <SignOutButton />
      </div>
    </div>
  );
}
