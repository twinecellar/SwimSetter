"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CompletionTags } from "@/app/components/CompletionTags";

interface CompletionFormProps {
  planId: string;
  children?: React.ReactNode;
}

const SUGGESTED_TAGS = ["fun", "easy", "hard", "long", "short"];

type Rating = 1 | 0;

export function CompletionForm({ planId, children }: CompletionFormProps) {
  const router = useRouter();
  const [rating, setRating] = useState<Rating | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleTag(tag: string) {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }

  function addCustomTag() {
    const trimmed = customTag.trim();
    if (!trimmed) return;
    if (!tags.includes(trimmed)) {
      setTags((prev) => [...prev, trimmed]);
    }
    setCustomTag("");
  }

  async function saveCompletion() {
    if (rating === null) return;
    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/plans/${planId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating,
          tags,
          notes: notes.trim() || null,
        }),
      });

      if (!response.ok) {
        const json = await response.json().catch(() => ({}));
        if (response.status === 429 || json.code === "OVER_REQUEST_RATE_LIMIT") {
          setError("Too many auth requests. Wait about a minute, then retry.");
          setSaving(false);
          return;
        }
        setError(json.error ?? "Failed to save completion.");
        setSaving(false);
        return;
      }

      router.push("/?just_completed=1");
    } catch {
      setError("Something went wrong. Please try again.");
      setSaving(false);
    }
  }

  const divider = (
    <div style={{ borderTop: '1px solid var(--fog-dark)', margin: '20px 0' }} />
  );

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void saveCompletion();
      }}
    >
      {/* Single content card */}
      <div
        className="completion-card"
        style={{
          background: 'white',
          borderRadius: 'var(--radius) var(--radius) 0 0',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          padding: '24px',
          margin: '0 24px',
        }}
      >
        {/* Rating buttons */}
        <div style={{ animation: 'fadeUp 0.4s ease 0.08s both' }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <RatingButton
              label="Good session"
              selected={rating === 1}
              selectedBg="var(--mint-light)"
              selectedBorder="var(--mint)"
              selectedColor="var(--mint)"
              selectedShadow="0 4px 12px rgba(59,175,126,0.15)"
              onClick={() => setRating(rating === 1 ? null : 1)}
              icon={<ThumbUpIcon selected={rating === 1} color="var(--mint)" />}
            />
            <RatingButton
              label="Rough one"
              selected={rating === 0}
              selectedBg="var(--coral-light)"
              selectedBorder="var(--coral)"
              selectedColor="var(--coral)"
              selectedShadow="0 4px 12px rgba(232,98,74,0.15)"
              onClick={() => setRating(rating === 0 ? null : 0)}
              icon={<ThumbDownIcon selected={rating === 0} color="var(--coral)" />}
            />
          </div>
        </div>

        {divider}

        {/* Session summary (injected from server) */}
        <div style={{ animation: 'fadeUp 0.4s ease 0.14s both' }}>
          {children}
        </div>

        {divider}

        {/* Tags & notes */}
        <div style={{ animation: 'fadeUp 0.4s ease 0.20s both' }}>
          <CompletionTags
            selected={tags}
            suggested={SUGGESTED_TAGS}
            customTag={customTag}
            onToggleTag={toggleTag}
            onCustomTagChange={setCustomTag}
            onAddCustomTag={addCustomTag}
          />
        </div>

        {divider}

        {/* Notes */}
        <div style={{ animation: 'fadeUp 0.4s ease 0.26s both' }}>
          <p style={{
            fontFamily: 'var(--font-fraunces)',
            fontSize: '17px', fontWeight: 600,
            color: 'var(--ink)', margin: '0 0 12px',
          }}>
            Anything to remember?
          </p>
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            className="completion-textarea"
            placeholder="Anything to remember for next time? (optional)"
            style={{
              width: '100%',
              background: 'var(--fog)',
              border: '1.5px solid var(--fog-dark)',
              borderRadius: 'var(--radius-sm)',
              padding: '14px 16px',
              fontFamily: 'var(--font-dm-sans)',
              fontSize: '14px',
              color: 'var(--ink)',
              lineHeight: 1.6,
              minHeight: '100px',
              resize: 'vertical',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {error && (
          <p style={{
            color: 'var(--coral)',
            fontFamily: 'var(--font-dm-sans)',
            fontSize: '14px',
            marginTop: '16px',
          }}>
            {error}
          </p>
        )}
      </div>

      {/* Sticky save footer */}
      <div
        className="completion-footer"
        style={{ animation: 'fadeUp 0.4s ease 0.32s both' }}
      >
        <button
          type="submit"
          disabled={saving || rating === null}
          className="completion-save-btn"
          style={{
            width: '100%',
            background: 'var(--yolk)',
            border: 'none',
            borderRadius: 'var(--radius)',
            padding: '18px 24px',
            fontFamily: 'var(--font-fraunces)',
            fontSize: '18px',
            fontWeight: 700,
            color: 'var(--ink)',
            letterSpacing: '-0.3px',
            cursor: rating === null ? 'default' : 'pointer',
            boxShadow: '0 4px 16px rgba(245,200,0,0.25)',
          }}
        >
          {saving ? "Saving..." : "Save session"}
        </button>
      </div>
    </form>
  );
}

/* ── Sub-components ─────────────────────────────────── */

interface RatingButtonProps {
  label: string;
  selected: boolean;
  selectedBg: string;
  selectedBorder: string;
  selectedColor: string;
  selectedShadow: string;
  onClick: () => void;
  icon: React.ReactNode;
}

function RatingButton({
  label,
  selected,
  selectedBg,
  selectedBorder,
  selectedColor,
  selectedShadow,
  onClick,
  icon,
}: RatingButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="completion-rating-btn"
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        padding: '16px 12px',
        borderRadius: 'var(--radius)',
        border: `1.5px solid ${selected ? selectedBorder : 'var(--fog-dark)'}`,
        background: selected ? selectedBg : 'white',
        color: selected ? selectedColor : 'var(--ink-soft)',
        fontFamily: 'var(--font-dm-sans)',
        fontSize: '15px',
        fontWeight: 600,
        cursor: 'pointer',
        boxShadow: selected ? selectedShadow : 'none',
        transform: selected ? 'translateY(-1px)' : 'none',
        transition: 'all 0.18s ease',
      }}
    >
      {icon}
      {label}
    </button>
  );
}

function ThumbUpIcon({ selected, color }: { selected: boolean; color: string }) {
  return (
    <svg
      width="24" height="24" viewBox="0 0 24 24" fill="none"
      stroke={selected ? color : 'var(--ink-soft)'}
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
    >
      <path d="M7 10v12" />
      <path d="M15 5.88L14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z" />
    </svg>
  );
}

function ThumbDownIcon({ selected, color }: { selected: boolean; color: string }) {
  return (
    <svg
      width="24" height="24" viewBox="0 0 24 24" fill="none"
      stroke={selected ? color : 'var(--ink-soft)'}
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
    >
      <path d="M17 14V2" />
      <path d="M9 18.12L10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L13 22a3.13 3.13 0 0 1-3-3.88Z" />
    </svg>
  );
}
