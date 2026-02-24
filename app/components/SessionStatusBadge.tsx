interface SessionStatusBadgeProps {
  status: "planned" | "in_progress" | "completed";
}

const STATUS_COPY: Record<
  SessionStatusBadgeProps["status"],
  { label: string; className: string }
> = {
  planned: {
    label: "Planned",
    className: "bg-sky-500/10 text-sky-300 border border-sky-500/30",
  },
  in_progress: {
    label: "In progress",
    className: "bg-amber-500/10 text-amber-300 border border-amber-500/30",
  },
  completed: {
    label: "Completed",
    className: "bg-emerald-500/10 text-emerald-300 border border-emerald-500/30",
  },
};

export function SessionStatusBadge({ status }: SessionStatusBadgeProps) {
  const config = STATUS_COPY[status];

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${config.className}`}
    >
      {config.label}
    </span>
  );
}
