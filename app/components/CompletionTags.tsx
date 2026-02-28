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
  const fieldStyle = {
    backgroundColor: "#f8fafc",
    borderColor: "#e2e8f0",
    color: "#0f172a",
  };

  const actionStyle = {
    backgroundColor: "#f8fafc",
    borderColor: "#e2e8f0",
    color: "#334155",
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-200">
        Tags
        <span className="ml-1 text-xs font-normal text-slate-400">
          (pick a few that describe how it felt)
        </span>
      </label>

      <div className="flex flex-wrap gap-2 text-xs">
        {suggested.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => onToggleTag(tag)}
            className={`rounded-full px-3 py-1 ${
              selected.includes(tag)
                ? "bg-sky-500 text-slate-950"
                : "bg-slate-900 text-slate-200"
            }`}
            style={!selected.includes(tag) ? actionStyle : undefined}
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
          className="flex-1 rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 outline-none focus:border-sky-500"
          style={fieldStyle}
        />
        <button
          type="button"
          onClick={onAddCustomTag}
          className="rounded-md border border-slate-700 px-3 py-2 text-xs font-medium text-slate-200 hover:border-sky-500"
          style={actionStyle}
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
