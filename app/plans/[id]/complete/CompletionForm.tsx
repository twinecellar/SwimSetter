"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CompletionTags } from "@/app/components/CompletionTags";

interface CompletionFormProps {
  planId: string;
}

const SUGGESTED_TAGS = [
  "fun",
  "tough",
  "easy",
  "speedy",
  "drills",
  "kicking",
  "endurance",
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

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void saveCompletion(true);
      }}
      className="space-y-6"
    >
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-200">Rating</label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setRating(value)}
              className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold ${
                rating === value
                  ? "bg-emerald-500 text-slate-950"
                  : "bg-slate-900 text-slate-200 hover:bg-slate-800"
              }`}
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      <CompletionTags
        selected={tags}
        suggested={SUGGESTED_TAGS}
        customTag={customTag}
        onToggleTag={toggleTag}
        onCustomTagChange={setCustomTag}
        onAddCustomTag={addCustomTag}
      />

      <div className="space-y-2">
        <button
          type="button"
          onClick={() => setNotesOpen((prev) => !prev)}
          className="text-sm font-medium text-slate-200 underline decoration-slate-500 underline-offset-4 hover:text-sky-300"
        >
          {notesOpen ? "Hide notes" : "Add optional notes"}
        </button>

        {notesOpen && (
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={3}
            className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 outline-none focus:border-sky-500"
            placeholder="Anything you want to remember for next time?"
          />
        )}
      </div>

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
          onClick={() => void saveCompletion(false)}
          className="inline-flex items-center rounded-md border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 hover:border-sky-500 disabled:opacity-60"
        >
          Skip notes and save
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={() => router.push("/?return=completion")}
          className="inline-flex items-center rounded-md border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 hover:border-slate-500 disabled:opacity-60"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
