interface SessionStatusBadgeProps {
  status: "planned" | "in_progress" | "completed";
}

const STATUS_CONFIG: Record<
  SessionStatusBadgeProps["status"],
  { label: string; bg: string; color: string; border: string }
> = {
  planned: {
    label: "Planned",
    bg: "rgba(0, 200, 216, 0.1)",
    color: "#006D7A",
    border: "rgba(0, 200, 216, 0.35)",
  },
  in_progress: {
    label: "In progress",
    bg: "rgba(245, 158, 11, 0.1)",
    color: "#b45309",
    border: "rgba(245, 158, 11, 0.35)",
  },
  completed: {
    label: "Completed",
    bg: "rgba(16, 185, 129, 0.1)",
    color: "#047857",
    border: "rgba(16, 185, 129, 0.35)",
  },
};

export function SessionStatusBadge({ status }: SessionStatusBadgeProps) {
  const { label, bg, color, border } = STATUS_CONFIG[status];

  return (
    <span
      className="inline-flex items-center rounded-full px-2\.5 py-1 text-xs font-semibold"
      style={{ backgroundColor: bg, color, border: `1px solid ${border}` }}
    >
      {label}
    </span>
  );
}
