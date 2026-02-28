import type { Effort } from "@/lib/plan-types";

/** Solid fill colour — for segment dots, selected button backgrounds, etc. */
export const EFFORT_SOLID: Record<Effort, string> = {
  easy:   "#10b981", // emerald-500
  medium: "#f59e0b", // amber-500
  hard:   "#ef4444", // red-500
};

/** Foreground text on a solid background */
export const EFFORT_SOLID_TEXT: Record<Effort, string> = {
  easy:   "#ffffff",
  medium: "#1c1917", // dark for legibility on amber
  hard:   "#ffffff",
};

/** Pill / badge style — tinted background + matching border + dark text */
export function effortPillStyle(effort: Effort): React.CSSProperties {
  const palette: Record<Effort, { bg: string; border: string; color: string }> = {
    easy:   { bg: "rgba(16, 185, 129, 0.10)", border: "rgba(16, 185, 129, 0.30)", color: "#047857" },
    medium: { bg: "rgba(245, 158, 11,  0.10)", border: "rgba(245, 158, 11,  0.30)", color: "#92400e" },
    hard:   { bg: "rgba(239, 68,  68,  0.10)", border: "rgba(239, 68,  68,  0.30)", color: "#991b1b" },
  };
  const { bg, border, color } = palette[effort];
  return { backgroundColor: bg, borderColor: border, color };
}

/** Selected button style for the effort toggle */
export function effortButtonStyle(effort: Effort, selected: boolean): React.CSSProperties {
  if (selected) {
    return {
      backgroundColor: EFFORT_SOLID[effort],
      color: EFFORT_SOLID_TEXT[effort],
      borderColor: EFFORT_SOLID[effort],
    };
  }
  // Unselected: outlined ghost — transparent bg, solid border, coloured text
  const outline: Record<Effort, { border: string; color: string }> = {
    easy:   { border: "#10b981", color: "#047857" },
    medium: { border: "#f59e0b", color: "#92400e" },
    hard:   { border: "#ef4444", color: "#991b1b" },
  };
  const { border, color } = outline[effort];
  return { backgroundColor: "transparent", borderColor: border, color };
}
