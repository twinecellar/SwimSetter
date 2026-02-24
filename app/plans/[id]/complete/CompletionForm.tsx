"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

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

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
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
        setError(json.error ?? "Failed to save completion.");
        setSaving(false);
        return;
      }

      router.push("/plans");
    } catch {
      setError("Something went wrong. Please try again.");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-200">
          Rating
        </label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setRating(value)}
              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${
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

      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-200">
          Tags
          <span className="ml-1 text-xs font-normal text-slate-400">
            (pick a few that describe how it felt)
          </span>
        </label>
        <div className="flex flex-wrap gap-2 text-xs">
          {SUGGESTED_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              className={`rounded-full px-3 py-1 ${
                tags.includes(tag)
                  ? "bg-sky-500 text-slate-950"
                  : "bg-slate-900 text-slate-200 hover:bg-slate-800"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={customTag}
            onChange={(event) => setCustomTag(event.target.value)}
            placeholder="Custom tag"
            className="flex-1 rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 outline-none focus:border-sky-500"
          />
          <button
            type="button"
            onClick={addCustomTag}
            className="rounded-md border border-slate-700 px-3 py-2 text-xs font-medium text-slate-200 hover:border-sky-500"
          >
            Add
          </button>
        </div>

        {tags.length > 0 && (
          <p className="text-xs text-slate-400">
            Selected:{" "}
            <span className="font-medium text-slate-200">
              {tags.join(", ")}
            </span>
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-200">
          Notes
        </label>
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          rows={3}
          className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 outline-none focus:border-sky-500"
          placeholder="Anything you want to remember for next time?"
        />
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center rounded-md bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-400 disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save completion"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/plans")}
          className="inline-flex items-center rounded-md border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 hover:border-slate-500"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

