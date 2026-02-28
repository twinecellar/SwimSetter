"use client";

import type { DurationMinutes, Effort, PlanRequest } from "@/lib/plan-types";
import { effortButtonStyle } from "@/lib/effort-colors";
import { REQUESTED_TAG_OPTIONS } from "@/lib/request-options";

const DURATION_PRESETS: DurationMinutes[] = [20, 30, 45, 60];

function ClockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 6.72C12 6.47161 12 6.34742 12.0567 6.24546C12.1028 6.1624 12.1921 6.08326 12.2801 6.04738C12.3881 6.00333 12.4981 6.0166 12.7183 6.04315C13.52 6.13981 14.2964 6.39764 15 6.80385C15.9121 7.33046 16.6695 8.08788 17.1962 9C17.7228 9.91212 18 10.9468 18 12C18 13.0532 17.7228 14.0879 17.1962 15C16.6695 15.9121 15.9121 16.6695 15 17.1962C14.0879 17.7228 13.0532 18 12 18C10.9468 18 9.91211 17.7228 9 17.1962C8.29643 16.7899 7.68491 16.2464 7.20036 15.6005C7.0673 15.4231 7.00077 15.3344 6.98491 15.2189C6.97199 15.1247 6.9959 15.0078 7.04475 14.9263C7.10472 14.8263 7.21227 14.7642 7.42739 14.64L11.64 12.2078C11.7711 12.1321 11.8367 12.0943 11.8844 12.0413C11.9266 11.9944 11.9585 11.8793 11.978 11.8793C12 11.8115 12 11.7357 12 11.5843V6.72Z" fill="currentColor"/>
      <circle cx="12" cy="12" r="8.5" stroke="currentColor"/>
    </svg>
  );
}

function PressureIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M20.6933 17.3294C21.0506 15.9959 21.0964 14.5982 20.8271 13.2442C20.5577 11.8902 19.9806 10.6164 19.1402 9.52115C18.2998 8.42593 17.2187 7.53872 15.9806 6.92815C14.7425 6.31757 13.3805 6 12 6C10.6195 6 9.25752 6.31757 8.0194 6.92815C6.78128 7.53872 5.70021 8.42593 4.85982 9.52115C4.01943 10.6164 3.44225 11.8902 3.17293 13.2442C2.90361 14.5982 2.94937 15.9959 3.30667 17.3294" stroke="currentColor" strokeLinecap="round"/>
      <path d="M12.7657 15.5823C13.2532 16.2916 12.9104 17.3738 12 17.9994C11.0897 18.625 9.95652 18.5571 9.46906 17.8477C8.94955 17.0917 7.15616 12.8409 6.06713 10.2114C5.86203 9.71621 6.4677 9.3 6.85648 9.669C8.92077 11.6283 12.2462 14.8263 12.7657 15.5823Z" stroke="currentColor"/>
      <path d="M12 6V8" stroke="currentColor" strokeLinecap="round"/>
      <path d="M5.63599 8.63574L7.0502 10.05" stroke="currentColor" strokeLinecap="round"/>
      <path d="M18.364 8.63574L16.9498 10.05" stroke="currentColor" strokeLinecap="round"/>
      <path d="M20.6934 17.3291L18.7615 16.8115" stroke="currentColor" strokeLinecap="round"/>
      <path d="M3.30664 17.3291L5.23849 16.8115" stroke="currentColor" strokeLinecap="round"/>
    </svg>
  );
}

function LabelIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 8C3 7.05719 3 6.58579 3.29289 6.29289C3.58579 6 4.05719 6 5 6H15.9296C16.4536 6 16.7156 6 16.9367 6.11833C17.1578 6.23665 17.3031 6.45463 17.5937 6.8906L20.2604 10.8906C20.6189 11.4283 20.7981 11.6972 20.7981 12C20.7981 12.3028 20.6189 12.5717 20.2604 13.1094L17.5937 17.1094C17.3031 17.5454 17.1578 17.7633 16.9367 17.8817C16.7156 18 16.4536 18 15.9296 18H5C4.05719 18 3.58579 18 3.29289 17.7071C3 17.4142 3 16.9428 3 16V8Z" stroke="currentColor"/>
      <circle cx="15" cy="12" r="1" fill="currentColor" stroke="currentColor"/>
    </svg>
  );
}

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
    onChange({ ...value, requested_tags: nextTags });
  }

  function getControlStyles(effort: Effort, selected: boolean) {
    return {
      ...effortButtonStyle(effort, selected),
      width: "100%",
      minHeight: "2.25rem",
      whiteSpace: "nowrap" as const,
      display: "flex",
      justifyContent: "center" as const,
      alignItems: "center" as const,
    };
  }

  function durationButtonStyle(selected: boolean): React.CSSProperties {
    return selected
      ? { backgroundColor: "#0ea5e9", borderColor: "#0ea5e9", color: "#111827" }
      : { backgroundColor: "transparent", borderColor: "#475569", color: "#94a3b8" };
  }

  function getChipStyles(selected: boolean) {
    return selected
      ? { backgroundColor: "#0ea5e9", color: "#ffffff", borderColor: "#0ea5e9", whiteSpace: "nowrap" as const }
      : { backgroundColor: "#f8fafc", color: "#334155", borderColor: "#e2e8f0", whiteSpace: "nowrap" as const };
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-lg border border-slate-800 bg-slate-900/60 px-4 py-3">
        <div className="flex items-center gap-1.5 text-slate-400">
          <ClockIcon />
          <span className="text-xs font-semibold uppercase tracking-wide">Duration</span>
        </div>
        <div className="mt-3 flex gap-1.5">
          {DURATION_PRESETS.map((minutes) => (
            <button
              key={minutes}
              type="button"
              disabled={disabled}
              onClick={() => onChange({ ...value, duration_minutes: minutes })}
              className="flex-1 rounded-md border py-1 text-xs font-medium disabled:opacity-60"
              style={durationButtonStyle(value.duration_minutes === minutes)}
            >
              {minutes}m
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-slate-800 bg-slate-900/60 px-4 py-3">
        <div className="flex items-center gap-1.5 text-slate-400">
          <PressureIcon />
          <span className="text-xs font-semibold uppercase tracking-wide">Effort</span>
        </div>
        <div
          className="mt-3 grid gap-1.5"
          style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}
        >
          {(["easy", "medium", "hard"] as Effort[]).map((effort) => (
            <button
              key={effort}
              type="button"
              disabled={disabled}
              onClick={() => onChange({ ...value, effort })}
              className="rounded-md border px-2 py-1 text-xs capitalize disabled:opacity-60"
              style={getControlStyles(effort, value.effort === effort)}
            >
              {effort}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-slate-800 bg-slate-900/60 px-4 py-3">
        <div className="flex items-center gap-1.5 text-slate-400">
          <LabelIcon />
          <span className="text-xs font-semibold uppercase tracking-wide">Tags</span>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {REQUESTED_TAG_OPTIONS.map((tag) => (
            <button
              key={tag}
              type="button"
              disabled={disabled}
              onClick={() => toggleRequestedTag(tag)}
              className="rounded-full border px-2.5 py-1 text-xs capitalize disabled:opacity-60"
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
