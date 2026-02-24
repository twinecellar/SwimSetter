import type { CompletionRow, PlanSegment } from "@/lib/plan-types";

export function formatSessionDate(iso: string): string {
  const date = new Date(iso);
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

export function groupSegments(segments: PlanSegment[]) {
  if (segments.length <= 1) {
    return [
      {
        title: "Main",
        items: segments,
      },
    ];
  }

  if (segments.length === 2) {
    return [
      { title: "Warm up", items: [segments[0]] },
      { title: "Main", items: [segments[1]] },
    ];
  }

  const warmUpCount = Math.max(1, Math.floor(segments.length / 3));
  const coolDownCount = Math.max(1, Math.floor(segments.length / 3));
  const mainCount = Math.max(1, segments.length - warmUpCount - coolDownCount);

  return [
    {
      title: "Warm up",
      items: segments.slice(0, warmUpCount),
    },
    {
      title: "Main",
      items: segments.slice(warmUpCount, warmUpCount + mainCount),
    },
    {
      title: "Cool down",
      items: segments.slice(warmUpCount + mainCount),
    },
  ].filter((group) => group.items.length > 0);
}

export function completionByPlanId(completions: CompletionRow[]) {
  return completions.reduce<Record<string, CompletionRow>>((acc, completion) => {
    if (!acc[completion.plan_id]) {
      acc[completion.plan_id] = completion;
    }
    return acc;
  }, {});
}
