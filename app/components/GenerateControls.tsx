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
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Duration
        </p>
        <div className="mt-2 flex gap-2">
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
              className={`rounded-md px-3 py-1.5 text-sm ${
                value.duration_minutes === minutes
                  ? "bg-sky-500 text-slate-950"
                  : "bg-slate-900 text-slate-200 hover:bg-slate-800"
              } disabled:opacity-60`}
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
        <div className="mt-2 flex gap-2">
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
              className={`rounded-md px-3 py-1.5 text-sm capitalize ${
                value.effort === effort
                  ? "bg-sky-500 text-slate-950"
                  : "bg-slate-900 text-slate-200 hover:bg-slate-800"
              } disabled:opacity-60`}
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
        <div className="mt-2 flex gap-2">
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
              className={`rounded-md px-3 py-1.5 text-sm ${
                value.fun_mode === mode.value
                  ? "bg-sky-500 text-slate-950"
                  : "bg-slate-900 text-slate-200 hover:bg-slate-800"
              } disabled:opacity-60`}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
