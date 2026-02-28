"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CompletionTags } from "@/app/components/CompletionTags";

interface CompletionFormProps {
  planId: string;
  children?: React.ReactNode;
}

const SUGGESTED_TAGS = ["fun", "easy", "hard", "long", "short"];

const RATING_OPTIONS = [
  { value: 1 as const, label: "Good session", img: "/thumb_up.png" },
  { value: 0 as const, label: "Rough one",    img: "/thumb_down.png" },
];

export function CompletionForm({ planId, children }: CompletionFormProps) {
  const router = useRouter();
  const [rating, setRating] = useState<0 | 1>(1);
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

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void saveCompletion();
      }}
      className="space-y-4"
    >
      {/* Rating */}
      <section className="space-y-3 rounded-lg border border-slate-800 bg-slate-900/40 p-4">
        <label className="block text-sm font-medium text-slate-200">How was it?</label>
        <div className="flex gap-3">
          {RATING_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setRating(option.value)}
              className="flex flex-1 items-center justify-center gap-2 rounded-md border py-3 text-sm font-medium transition-colors"
              style={{
                backgroundColor: rating === option.value ? "rgba(14,165,233,0.12)" : "transparent",
                borderColor: rating === option.value ? "#0ea5e9" : "#334155",
                color: rating === option.value ? "#38bdf8" : "#94a3b8",
              }}
            >
              <img src={option.img} alt="" width={20} height={20} />
              {option.label}
            </button>
          ))}
        </div>
      </section>

      {children}

      {/* Tags */}
      <section className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
        <CompletionTags
          selected={tags}
          suggested={SUGGESTED_TAGS}
          customTag={customTag}
          onToggleTag={toggleTag}
          onCustomTagChange={setCustomTag}
          onAddCustomTag={addCustomTag}
        />
      </section>

      {/* Notes */}
      <section className="space-y-2 rounded-lg border border-slate-800 bg-slate-900/40 p-4">
        <label className="block text-sm font-medium text-slate-200">Notes</label>
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          rows={3}
          className="w-full rounded-md border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-sky-500"
          placeholder="Anything to remember for next time? (optional)"
        />
      </section>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="space-y-2">
        <button
          type="submit"
          disabled={saving}
          className="flex w-full items-center justify-center rounded-md border px-4 py-2.5 text-sm font-medium disabled:opacity-60"
          style={{
            backgroundColor: "#10b981",
            borderColor: "#10b981",
            color: "#111827",
          }}
        >
          {saving ? "Saving..." : "Save completion"}
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={() => router.push("/?return=completion")}
          className="flex w-full items-center justify-center rounded-md border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-300 disabled:opacity-60"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
