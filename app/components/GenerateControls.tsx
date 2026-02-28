"use client";

import type { Effort, PlanRequest } from "@/lib/plan-types";
import { REQUESTED_TAG_OPTIONS } from "@/lib/request-options";

interface GenerateControlsProps {
  value: PlanRequest;
  disabled?: boolean;
  onChange: (next: PlanRequest) => void;
}

export function GenerateControls({
  value,
  disabled = false,
  onChange,
}: GenerateControlsProps) {
  function toggleRequestedTag(tag: string) {
    const current = value.requested_tags ?? [];
    const nextTags = current.includes(tag)
      ? current.filter((t) => t !== tag)
      : [...current, tag];

    onChange({
      ...value,
      requested_tags: nextTags,
    });
  }

  function getControlStyles(selected: boolean) {
    const stateStyles = selected
      ? {
          backgroundColor: "#0ea5e9",
          color: "#ffffff",
          borderColor: "#0ea5e9",
        }
      : {
          backgroundColor: "#f8fafc",
          color: "#334155",
          borderColor: "#e2e8f0",
        };

    return {
      ...stateStyles,
      width: "100%",
      minHeight: "3rem",
      whiteSpace: "nowrap" as const,
      display: "flex",
      justifyContent: "center" as const,
      alignItems: "center" as const,
    };
  }

  function getChipStyles(selected: boolean) {
    const stateStyles = selected
      ? {
          backgroundColor: "#0ea5e9",
          color: "#ffffff",
          borderColor: "#0ea5e9",
        }
      : {
          backgroundColor: "#f8fafc",
          color: "#334155",
          borderColor: "#e2e8f0",
        };

    return {
      ...stateStyles,
      whiteSpace: "nowrap" as const,
    };
  }

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Duration
        </p>
        <div className="mt-2 space-y-2">
          <input
            type="range"
            min={15}
            max={60}
            step={5}
            value={value.duration_minutes}
            disabled={disabled}
            onChange={(event) =>
              onChange({
                ...value,
                duration_minutes: Number(event.target.value) as PlanRequest["duration_minutes"],
              })
            }
            className="w-full accent-sky-500 disabled:opacity-60"
          />
          <p className="text-sm text-slate-300">{value.duration_minutes} min</p>
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Effort
        </p>
        <div
          className="mt-2 grid gap-2"
          style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}
        >
          {(["easy", "medium", "hard"] as Effort[]).map((effort) => (
            <button
              key={effort}
              type="button"
              disabled={disabled}
              onClick={() =>
                onChange({
                  ...value,
                  effort,
                })
              }
              className="rounded-md border px-3 py-1.5 text-sm capitalize disabled:opacity-60"
              style={getControlStyles(value.effort === effort)}
            >
              {effort}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Tags (optional)
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {REQUESTED_TAG_OPTIONS.map((tag) => (
            <button
              key={tag}
              type="button"
              disabled={disabled}
              onClick={() => toggleRequestedTag(tag)}
              className="rounded-full border px-3 py-1.5 text-xs capitalize disabled:opacity-60"
              style={getChipStyles((value.requested_tags ?? []).includes(tag))}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
