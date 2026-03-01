"use client";

import type { DurationMinutes, Effort, PlanRequest } from "@/lib/plan-types";
import { REQUESTED_TAG_OPTIONS } from "@/lib/request-options";

const DURATION_PRESETS: DurationMinutes[] = [20, 30, 45, 60];

function EasyWaveIcon() {
  return (
    <svg width="28" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M2 12 C5 8, 9 8, 12 12 C15 16, 19 16, 22 12" />
    </svg>
  );
}

function MediumWaveIcon() {
  return (
    <svg width="28" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M2 14 C5 8, 9 8, 12 12 C15 16, 19 10, 22 8" />
    </svg>
  );
}

function HardWaveIcon() {
  return (
    <svg width="28" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M2 18 C4 12, 7 6, 12 6 C17 6, 20 4, 22 2" />
    </svg>
  );
}

const EFFORT_CONFIG: Record<Effort, {
  label: string;
  Icon: () => React.ReactElement;
  activeShadow: string;
  activeColor: string;
}> = {
  easy: {
    label: 'Easy',
    Icon: EasyWaveIcon,
    activeShadow: '0 0 0 2px #3BAF7E, 0 4px 12px rgba(59,175,126,0.15)',
    activeColor: 'white',
  },
  medium: {
    label: 'Medium',
    Icon: MediumWaveIcon,
    activeShadow: '0 0 0 2px #F08C30, 0 4px 12px rgba(240,140,48,0.15)',
    activeColor: 'white',
  },
  hard: {
    label: 'Hard',
    Icon: HardWaveIcon,
    activeShadow: '0 0 0 2px #E8624A, 0 4px 12px rgba(232,98,74,0.15)',
    activeColor: 'white',
  },
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontFamily: 'var(--font-dm-sans)',
      fontSize: '11px', fontWeight: 600,
      letterSpacing: '0.1em', textTransform: 'uppercase',
      color: 'var(--ink-soft)', opacity: 0.5,
      padding: '0 24px 10px', margin: 0,
    }}>
      {children}
    </p>
  );
}

interface GenerateControlsProps {
  value: PlanRequest;
  disabled?: boolean;
  onChange: (next: PlanRequest) => void;
}

export function GenerateControls({ value, disabled = false, onChange }: GenerateControlsProps) {
  function toggleTag(tag: string) {
    const current = value.requested_tags ?? [];
    const nextTags = current.includes(tag)
      ? current.filter((t) => t !== tag)
      : [...current, tag];
    onChange({ ...value, requested_tags: nextTags });
  }

  return (
    <>
      {/* Duration */}
      <div style={{ animation: 'fadeUp 0.4s ease 0.18s both' }}>
        <SectionLabel>How long?</SectionLabel>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '8px', padding: '0 24px 28px',
        }}>
          {DURATION_PRESETS.map((minutes) => {
            const selected = value.duration_minutes === minutes;
            return (
              <button
                key={minutes}
                type="button"
                disabled={disabled}
                onClick={() => onChange({ ...value, duration_minutes: minutes })}
                className={`goby-duration-btn dur-btn${selected ? ' active' : ''}`}
                style={{
                  background: 'white',
                  borderRadius: 'var(--radius-sm)',
                  padding: '14px 4px',
                  border: 'none', cursor: 'pointer',
                  boxShadow: selected
                    ? '0 4px 12px rgba(59,158,191,0.3)'
                    : '0 1px 4px rgba(0,0,0,0.06)',
                  transform: selected ? 'translateY(-1px)' : 'none',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', gap: '2px',
                  opacity: disabled ? 0.6 : 1,
                }}
              >
                <span
                  className="dur-number"
                  style={{
                    fontFamily: 'var(--font-fraunces)',
                    fontSize: '22px', fontWeight: 700,
                    color: selected ? 'white' : 'var(--ink)', lineHeight: 1,
                  }}
                >
                  {minutes}
                </span>
                <span
                  className="dur-unit"
                  style={{
                    fontFamily: 'var(--font-dm-sans)',
                    fontSize: '11px', fontWeight: 500,
                    color: selected ? 'white' : 'var(--ink-soft)',
                    opacity: selected ? 1 : 0.5,
                  }}
                >
                  min
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Effort */}
      <div style={{ animation: 'fadeUp 0.4s ease 0.22s both' }}>
        <SectionLabel>How hard?</SectionLabel>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '8px', padding: '0 24px 28px',
        }}>
          {(['easy', 'medium', 'hard'] as Effort[]).map((effort) => {
            const { label, Icon, activeShadow, activeColor } = EFFORT_CONFIG[effort];
            const selected = value.effort === effort;
            return (
              <button
                key={effort}
                type="button"
                disabled={disabled}
                onClick={() => onChange({ ...value, effort })}
                className={`goby-effort-btn effort-btn ${effort}${selected ? ' active' : ''}`}
                style={{
                  background: 'white',
                  borderRadius: 'var(--radius-sm)',
                  padding: '16px 8px',
                  border: 'none', cursor: 'pointer',
                  boxShadow: selected ? activeShadow : '0 1px 4px rgba(0,0,0,0.06)',
                  transform: selected ? 'translateY(-1px)' : 'none',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', gap: '6px',
                  color: selected ? activeColor : 'var(--ink-soft)',
                  opacity: disabled ? 0.6 : 1,
                }}
              >
                <span className="effort-icon"><Icon /></span>
                <span className="effort-label" style={{
                  fontFamily: 'var(--font-dm-sans)',
                  fontSize: '13px', fontWeight: 600,
                  color: 'inherit',
                }}>
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tags */}
      <div style={{ animation: 'fadeUp 0.4s ease 0.26s both' }}>
        <SectionLabel>Any vibe?</SectionLabel>
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: '8px',
          padding: '0 24px 32px',
        }}>
          {REQUESTED_TAG_OPTIONS.map((tag) => {
            const selected = (value.requested_tags ?? []).includes(tag);
            return (
              <button
                key={tag}
                type="button"
                disabled={disabled}
                onClick={() => toggleTag(tag)}
                className={`goby-tag-chip${selected ? ' goby-tag-selected' : ''}`}
                style={{
                  border: `1.5px solid ${selected ? 'var(--ink)' : 'var(--fog-dark)'}`,
                  background: selected ? 'var(--ink)' : 'white',
                  color: selected ? 'var(--yolk)' : 'var(--ink-soft)',
                  borderRadius: '100px',
                  padding: '9px 16px',
                  fontFamily: 'var(--font-dm-sans)',
                  fontSize: '14px', fontWeight: 500,
                  cursor: 'pointer',
                  opacity: disabled ? 0.6 : 1,
                  textTransform: 'capitalize',
                }}
              >
                {tag}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
