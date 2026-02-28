"use client";

interface CompletionTagsProps {
  selected: string[];
  suggested: string[];
  customTag: string;
  onToggleTag: (tag: string) => void;
  onCustomTagChange: (value: string) => void;
  onAddCustomTag: () => void;
}

export function CompletionTags({
  selected,
  suggested,
  customTag,
  onToggleTag,
  onCustomTagChange,
  onAddCustomTag,
}: CompletionTagsProps) {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-slate-200">
        Tags
        <span className="ml-1 text-xs font-normal text-slate-400">
          (pick a few that describe how it felt)
        </span>
      </label>

      <div className="flex flex-wrap gap-2">
        {suggested.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => onToggleTag(tag)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              selected.includes(tag)
                ? "border-sky-500 bg-sky-500/20 text-sky-300"
                : "border-slate-700 bg-slate-800/60 text-slate-300"
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
          onChange={(event) => onCustomTagChange(event.target.value)}
          placeholder="Custom tag"
          className="flex-1 rounded-md border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-sky-500"
        />
        <button
          type="button"
          onClick={onAddCustomTag}
          className="rounded-md border border-slate-700 bg-slate-800/60 px-3 py-2 text-xs font-medium text-slate-300 hover:border-sky-500 hover:text-sky-300"
        >
          Add
        </button>
      </div>

      {selected.length > 0 && (
        <p className="text-xs text-slate-400">
          Selected: <span className="font-medium text-slate-200">{selected.join(", ")}</span>
        </p>
      )}
    </div>
  );
}
