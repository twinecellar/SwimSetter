"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CompletionTags } from "@/app/components/CompletionTags";

interface CompletionFormProps {
  planId: string;
}

const SUGGESTED_TAGS = [
  "fun",
  "easy",
  "hard",
  "long",
  "short",
];

export function CompletionForm({ planId }: CompletionFormProps) {
  const router = useRouter();
  const [rating, setRating] = useState<number | null>(4);
  const [tags, setTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState("");
  const [notes, setNotes] = useState("");
  const [notesOpen, setNotesOpen] = useState(false);
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

  async function saveCompletion(includeNotes: boolean) {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/plans/${planId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating,
          tags,
          notes: includeNotes ? notes.trim() || null : null,
        }),
      });

      if (!response.ok) {
        const json = await response.json().catch(() => ({}));
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

  const secondaryButtonStyle = {
    backgroundColor: "#162447",
    borderColor: "#334155",
    color: "#e2e8f0",
  };

  const noteToggleStyle = {
    backgroundColor: "#0f172a",
    borderColor: "#334155",
    color: "#cbd5e1",
  };

  const noteFieldStyle = {
    backgroundColor: "#0b1736",
    borderColor: "#334155",
    color: "#f8fafc",
  };

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void saveCompletion(true);
      }}
      className="space-y-6"
    >
      <section className="space-y-3 rounded-lg border border-slate-800 bg-slate-900/30 p-4">
        <div className="flex items-center justify-between gap-2">
          <label className="block text-sm font-medium text-slate-200">Rating</label>
          <p className="text-sm font-medium text-slate-300">{rating ?? 0}/5</p>
        </div>
        <div className="flex gap-1.5">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setRating(value)}
              aria-label={`Rate ${value} out of 5`}
              className="flex h-11 w-11 items-center justify-center rounded-md border text-2xl leading-none transition-colors"
              style={{
                backgroundColor: "#0b1736",
                borderColor: "#334155",
                color: rating && value <= rating ? "#fbbf24" : "#64748b",
              }}
            >
              ★
            </button>
          ))}
        </div>
      </section>

      <CompletionTags
        selected={tags}
        suggested={SUGGESTED_TAGS}
        customTag={customTag}
        onToggleTag={toggleTag}
        onCustomTagChange={setCustomTag}
        onAddCustomTag={addCustomTag}
      />

      <section className="space-y-2 rounded-lg border border-slate-800 bg-slate-900/30 p-4">
        <button
          type="button"
          onClick={() => setNotesOpen((prev) => !prev)}
          className="inline-flex items-center rounded-md border px-3 py-2 text-sm font-medium"
          style={noteToggleStyle}
        >
          {notesOpen ? "Hide notes" : "Any notes?"}
        </button>

        {notesOpen && (
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={3}
            className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 outline-none focus:border-sky-500"
            placeholder="Anything you want to remember for next time?"
            style={noteFieldStyle}
          />
        )}
      </section>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center rounded-md bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-400 disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save completion"}
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={() => router.push("/?return=completion")}
          className="inline-flex items-center rounded-md border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 hover:border-slate-500 disabled:opacity-60"
          style={secondaryButtonStyle}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
