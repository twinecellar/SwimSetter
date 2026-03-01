"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Step = "interval" | "rest";

export function OnboardingForm() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("interval");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function saveLevel(level: "beginner" | "intermediate" | "advanced") {
    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ swim_level: level, preferences: {} }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        if (res.status === 429 || json.code === "OVER_REQUEST_RATE_LIMIT") {
          setError("Too many auth requests. Wait about a minute, then retry.");
          setSaving(false);
          return;
        }
        setError(json.error ?? "Failed to save profile.");
        setSaving(false);
        return;
      }

      router.push("/welcome");
    } catch {
      setError("Something went wrong. Please try again.");
      setSaving(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--fog)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '52px 24px 40px',
    }}>
      <div style={{ maxWidth: '390px', width: '100%' }}>

        {/* Logo + wordmark */}
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          marginBottom: '32px', gap: '8px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <svg width="36" height="36" viewBox="0 0 80 50" fill="none" xmlns="http://www.w3.org/2000/svg">
              <ellipse cx="38" cy="25" rx="26" ry="13" fill="#F5C800" />
              <path d="M64 25 C72 15, 78 12, 76 25 C78 38, 72 35, 64 25Z" fill="#F5C800" />
              <ellipse cx="20" cy="22" rx="3.5" ry="3.5" fill="#1A1A2A" />
              <ellipse cx="21" cy="21" rx="1.2" ry="1.2" fill="white" />
              <path d="M30 20 C33 18, 36 18, 38 20" stroke="#D4A900" strokeWidth="1.5" strokeLinecap="round" fill="none" />
              <path d="M12 25 C8 20, 4 18, 6 25 C4 32, 8 30, 12 25Z" fill="#D4A900" />
            </svg>
            <span style={{
              fontFamily: 'var(--font-fraunces)',
              fontSize: '26px', fontWeight: 700,
              color: 'var(--ink)', letterSpacing: '-0.5px',
            }}>
              goby
            </span>
          </div>
          <p style={{
            fontFamily: 'var(--font-fraunces)',
            fontStyle: 'italic', fontSize: '18px',
            color: 'var(--ink-soft)', margin: 0, textAlign: 'center',
          }}>
            Let&apos;s find your goby.
          </p>
        </div>

        {/* Progress dots */}
        <div style={{
          display: 'flex', justifyContent: 'center', gap: '6px',
          marginBottom: '32px',
        }}>
          <div style={{
            width: '8px', height: '8px', borderRadius: '50%',
            background: step === 'interval' ? 'var(--ink)' : 'var(--fog-dark)',
            transition: 'background 0.2s ease',
          }} />
          <div style={{
            width: '8px', height: '8px', borderRadius: '50%',
            background: step === 'rest' ? 'var(--ink)' : 'var(--fog-dark)',
            transition: 'background 0.2s ease',
          }} />
        </div>

        {/* Step 1 */}
        {step === "interval" && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <h2 style={{
                fontFamily: 'var(--font-fraunces)',
                fontSize: '24px', fontWeight: 600,
                color: 'var(--ink)', letterSpacing: '-0.5px',
                margin: '0 0 8px',
              }}>
                Does this look familiar?
              </h2>
              <p style={{
                fontFamily: 'var(--font-dm-sans)',
                fontSize: '14px', color: 'var(--ink-soft)',
                opacity: 0.6, margin: 0, lineHeight: 1.5,
              }}>
                Answer a couple of quick questions so we can tailor your sessions.
              </p>
            </div>

            <div style={{
              background: 'white', borderRadius: 'var(--radius)',
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
              padding: '20px 24px',
            }}>
              <p style={{
                fontFamily: 'var(--font-fraunces)',
                fontSize: '22px', fontWeight: 700,
                color: 'var(--water)', margin: '0 0 6px',
              }}>
                4 × 100s off 2:00
              </p>
              <p style={{
                fontFamily: 'var(--font-dm-sans)',
                fontSize: '13px', color: 'var(--ink-soft)',
                opacity: 0.5, margin: 0,
              }}>
                A main set: 4 repetitions of 100 metres, leaving every 2 minutes
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                disabled={saving}
                onClick={() => saveLevel("advanced")}
                style={{
                  width: '100%', background: 'var(--ink)', color: 'white',
                  borderRadius: 'var(--radius)', padding: '16px', border: 'none',
                  fontFamily: 'var(--font-dm-sans)', fontSize: '15px', fontWeight: 600,
                  boxShadow: '0 4px 12px rgba(26,26,42,0.15)',
                  opacity: saving ? 0.6 : 1, cursor: saving ? 'not-allowed' : 'pointer',
                }}
              >
                Yes, I get it
              </button>
              <button
                disabled={saving}
                onClick={() => setStep("rest")}
                style={{
                  width: '100%', background: 'white', color: 'var(--ink-soft)',
                  borderRadius: 'var(--radius)', padding: '16px',
                  border: '1.5px solid var(--fog-dark)',
                  fontFamily: 'var(--font-dm-sans)', fontSize: '15px', fontWeight: 600,
                  opacity: saving ? 0.6 : 1, cursor: saving ? 'not-allowed' : 'pointer',
                }}
              >
                Not quite
              </button>
            </div>
          </div>
        )}

        {/* Step 2 */}
        {step === "rest" && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <h2 style={{
                fontFamily: 'var(--font-fraunces)',
                fontSize: '24px', fontWeight: 600,
                color: 'var(--ink)', letterSpacing: '-0.5px',
                margin: '0 0 8px',
              }}>
                What about this one?
              </h2>
              <p style={{
                fontFamily: 'var(--font-dm-sans)',
                fontSize: '14px', color: 'var(--ink-soft)',
                opacity: 0.6, margin: 0, lineHeight: 1.5,
              }}>
                Answer a couple of quick questions so we can tailor your sessions.
              </p>
            </div>

            <div style={{
              background: 'white', borderRadius: 'var(--radius)',
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
              padding: '20px 24px',
            }}>
              <p style={{
                fontFamily: 'var(--font-fraunces)',
                fontSize: '22px', fontWeight: 700,
                color: 'var(--water)', margin: '0 0 6px',
              }}>
                4 × 100s with 15s rest
              </p>
              <p style={{
                fontFamily: 'var(--font-dm-sans)',
                fontSize: '13px', color: 'var(--ink-soft)',
                opacity: 0.5, margin: 0,
              }}>
                4 repetitions of 100 metres, with 15 seconds rest between each
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                disabled={saving}
                onClick={() => saveLevel("intermediate")}
                style={{
                  width: '100%', background: 'var(--ink)', color: 'white',
                  borderRadius: 'var(--radius)', padding: '16px', border: 'none',
                  fontFamily: 'var(--font-dm-sans)', fontSize: '15px', fontWeight: 600,
                  boxShadow: '0 4px 12px rgba(26,26,42,0.15)',
                  opacity: saving ? 0.6 : 1, cursor: saving ? 'not-allowed' : 'pointer',
                }}
              >
                Yes, that&apos;s clear
              </button>
              <button
                disabled={saving}
                onClick={() => saveLevel("beginner")}
                style={{
                  width: '100%', background: 'white', color: 'var(--ink-soft)',
                  borderRadius: 'var(--radius)', padding: '16px',
                  border: '1.5px solid var(--fog-dark)',
                  fontFamily: 'var(--font-dm-sans)', fontSize: '15px', fontWeight: 600,
                  opacity: saving ? 0.6 : 1, cursor: saving ? 'not-allowed' : 'pointer',
                }}
              >
                Not really
              </button>
            </div>

            <button
              onClick={() => setStep("interval")}
              style={{
                background: 'none', border: 'none', padding: 0,
                fontFamily: 'var(--font-dm-sans)',
                fontSize: '13px', color: 'var(--ink-soft)',
                opacity: 0.5, cursor: 'pointer', alignSelf: 'flex-start',
              }}
            >
              ← Back
            </button>
          </div>
        )}

        {error && (
          <p style={{
            fontFamily: 'var(--font-dm-sans)',
            fontSize: '13px', color: 'var(--coral)',
            margin: '8px 0 0',
          }}>
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
