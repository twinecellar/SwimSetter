"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GOBY_FISH_COMPONENTS, GOBY_PROFILES, type GobySpecies } from "@/lib/gobies";

export function WelcomeReveal({ species }: { species: GobySpecies }) {
  const router = useRouter();
  const [swimDone, setSwimDone] = useState(false);

  const FishComponent = GOBY_FISH_COMPONENTS[species];
  const profile = GOBY_PROFILES[species];

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--fog)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 24px',
    }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px',
        maxWidth: '390px',
        width: '100%',
        textAlign: 'center',
      }}>
        {/* Label */}
        <p style={{
          fontFamily: 'var(--font-dm-sans)',
          fontSize: '11px', fontWeight: 600,
          letterSpacing: '0.1em', textTransform: 'uppercase',
          color: 'var(--ink-soft)',
          margin: 0,
          animation: 'fadeUp 0.5s ease 1.0s both',
        }}>
          Your Goby
        </p>

        {/* Fish — swims in, then bobs */}
        <div
          onAnimationEnd={!swimDone ? () => setSwimDone(true) : undefined}
          style={{
            animation: swimDone
              ? 'bob 3s ease-in-out infinite'
              : 'swimIn 0.9s ease-out both',
          }}
        >
          <FishComponent width={160} height={100} />
        </div>

        {/* Fish name */}
        <h1 style={{
          fontFamily: 'var(--font-fraunces)',
          fontSize: '32px', fontWeight: 700,
          color: 'var(--ink)', letterSpacing: '-0.5px',
          margin: 0,
          animation: 'fadeUp 0.5s ease 1.0s both',
        }}>
          {profile.name}
        </h1>

        {/* Species */}
        <p style={{
          fontFamily: 'var(--font-dm-sans)',
          fontSize: '13px', fontStyle: 'italic',
          color: 'var(--ink-soft)',
          margin: 0,
          animation: 'fadeUp 0.5s ease 1.1s both',
        }}>
          {profile.species}
        </p>

        {/* Descriptor */}
        <p style={{
          fontFamily: 'var(--font-dm-sans)',
          fontSize: '15px', color: 'var(--ink-soft)',
          lineHeight: 1.5, maxWidth: '260px',
          margin: 0,
          animation: 'fadeUp 0.5s ease 1.25s both',
        }}>
          {profile.descriptor}
        </p>

        {/* Continue button */}
        <button
          onClick={() => router.push('/')}
          className="goby-generate-btn"
          style={{
            width: '100%', maxWidth: '320px',
            background: 'var(--yolk)',
            fontFamily: 'var(--font-fraunces)',
            fontSize: '18px', fontWeight: 700,
            color: 'var(--ink)',
            borderRadius: 'var(--radius)',
            padding: '18px',
            border: 'none',
            boxShadow: '0 6px 24px rgba(245,200,0,0.4)',
            marginTop: '8px',
            animation: 'fadeUp 0.5s ease 1.5s both',
          }}
        >
          Let&apos;s swim →
        </button>
      </div>
    </div>
  );
}
