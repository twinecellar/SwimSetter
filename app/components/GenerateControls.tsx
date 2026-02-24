"use client";

import type { Effort, FunMode, PlanRequest } from "@/lib/plan-types";

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
  function getControlStyles(selected: boolean) {
    const stateStyles = selected
      ? {
          backgroundColor: "#0ea5e9",
          color: "#020617",
          borderColor: "#0ea5e9",
        }
      : {
          backgroundColor: "#0f172a",
          color: "#e2e8f0",
          borderColor: "#1e293b",
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

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Duration
        </p>
        <div
          className="mt-2 grid gap-2"
          style={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}
        >
          {[20, 30].map((minutes) => (
            <button
              key={minutes}
              type="button"
              disabled={disabled}
              onClick={() =>
                onChange({
                  ...value,
                  duration_minutes: minutes as 20 | 30,
                })
              }
              className="rounded-md border px-3 py-1.5 text-sm disabled:opacity-60"
              style={getControlStyles(value.duration_minutes === minutes)}
            >
              {minutes} min
            </button>
          ))}
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
          Style
        </p>
        <div
          className="mt-2 grid gap-2"
          style={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}
        >
          {([
            { value: "straightforward", label: "Straightforward" },
            { value: "fun", label: "Fun / varied" },
          ] as { value: FunMode; label: string }[]).map((mode) => (
            <button
              key={mode.value}
              type="button"
              disabled={disabled}
              onClick={() =>
                onChange({
                  ...value,
                  fun_mode: mode.value,
                })
              }
              className="rounded-md border px-3 py-1.5 text-sm disabled:opacity-60"
              style={getControlStyles(value.fun_mode === mode.value)}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
