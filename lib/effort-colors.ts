import type { Effort } from "@/lib/plan-types";

/** Solid fill colour — for segment dots, selected button backgrounds, etc. */
export const EFFORT_SOLID: Record<Effort, string> = {
  easy:   "#34d399", // emerald-400 (softer)
  medium: "#fb923c", // orange-400 (shifted from amber to avoid clashing with yellow)
  hard:   "#f87171", // red-400 (softer)
};

/** Foreground text on a solid background */
export const EFFORT_SOLID_TEXT: Record<Effort, string> = {
  easy:   "#065f46", // dark for legibility on light green
  medium: "#7c2d12", // dark for legibility on orange
  hard:   "#7f1d1d", // dark for legibility on light red
};

/** Pill / badge style — tinted background + matching border + dark text */
export function effortPillStyle(effort: Effort): React.CSSProperties {
  const palette: Record<Effort, { bg: string; border: string; color: string }> = {
    easy:   { bg: "rgba(52,  211, 153, 0.10)", border: "rgba(52,  211, 153, 0.30)", color: "#065f46" },
    medium: { bg: "rgba(251, 146, 60,  0.10)", border: "rgba(251, 146, 60,  0.30)", color: "#9a3412" },
    hard:   { bg: "rgba(248, 113, 113, 0.10)", border: "rgba(248, 113, 113, 0.30)", color: "#991b1b" },
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
    easy:   { border: "#34d399", color: "#047857" },
    medium: { border: "#fb923c", color: "#c2410c" },
    hard:   { border: "#f87171", color: "#b91c1c" },
  };
  const { border, color } = outline[effort];
  return { backgroundColor: "transparent", borderColor: border, color };
}
