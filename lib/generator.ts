export type SwimLevel = "beginner" | "intermediate" | "advanced";
export type EffortLevel = "easy" | "medium" | "hard";
export type FunMode = "straightforward" | "fun";

export interface Profile {
  id: string;
  swim_level: SwimLevel;
  preferences: Record<string, any>;
}

export interface PlanRequest {
  duration_minutes: 20 | 30;
  effort: EffortLevel;
  fun_mode: FunMode;
}

export interface PlanSegment {
  id: string;
  type: "session";
  distance_m: number;
  stroke: "mixed";
  description: string;
  effort: EffortLevel;
  repeats?: number;
  rest_seconds?: number;
}

export interface GeneratedPlan {
  duration_minutes: number;
  estimated_distance_m: number;
  segments: PlanSegment[];
  notes?: string;
  metadata: {
    version: "v1";
    swim_level: SwimLevel;
    input_effort: EffortLevel;
    input_fun_mode: FunMode;
  };
}

export interface PastPlan {
  id: string;
  created_at: string;
  plan: GeneratedPlan;
}

export interface PlanFeedback {
  plan_id: string;
  rating: number | null;
  tags: string[];
}

export interface GeneratorHistory {
  acceptedPlans: PastPlan[];
  feedbackByPlanId: Record<string, PlanFeedback>;
}

type SessionId =
  | "week1_mon_20min_4x5"
  | "week1_tue_6x75"
  | "week1_sat_500"
  | "week2_mon_20min_4x5"
  | "week2_tue_8x75"
  | "week2_sat_600"
  | "week3_mon_30min_3x10"
  | "week3_tue_5x100_plus_fast"
  | "week3_sat_800"
  | "week4_mon_30min_3x10"
  | "week4_tue_6x100_plus_fast"
  | "week4_sat_900"
  | "week5_mon_30min_3x10"
  | "week5_tue_30min_far_as_can"
  | "week5_sat_700"
  | "week6_mon_30min_easy"
  | "week6_tue_6x150_plus_fast"
  | "week6_sat_800"
  | "week7_mon_30min_easy"
  | "week7_tue_5x200"
  | "week7_sat_1000"
  | "week8_mon_35min_easy"
  | "week8_tue_6x200"
  | "week8_sat_1200"
  | "week9_mon_40min_2x20"
  | "week9_tue_30_40min_far_as_can"
  | "week9_sat_1300"
  | "week10_mon_40min_easy"
  | "week10_tue_8_10x100_race_pace"
  | "week10_sat_1200"
  | "week11_mon_30min_easy"
  | "week11_tue_30min_continuous"
  | "week11_sat_700"
  | "week12_thu_20min_continuous";

interface SwimSessionDefinition {
  id: SessionId;
  label: string;
  durationBucket: 20 | 30;
  effort: EffortLevel;
  fun_mode: FunMode | "either";
  estimatedDistanceM: number;
  description: string;
}

const SESSION_LIBRARY: SwimSessionDefinition[] = [
  {
    id: "week1_mon_20min_4x5",
    label: "20 min free, 4x5 min",
    durationBucket: 20,
    effort: "easy",
    fun_mode: "straightforward",
    estimatedDistanceM: 800,
    description:
      "20 min freestyle easy effort: 4 x 5 min swim with 2 min easy recovery between each block.",
  },
  {
    id: "week1_tue_6x75",
    label: "6x75m steady",
    durationBucket: 20,
    effort: "medium",
    fun_mode: "straightforward",
    estimatedDistanceM: 450,
    description: "6 x 75m steady effort with 30 sec recovery.",
  },
  {
    id: "week1_sat_500",
    label: "500m easy continuous",
    durationBucket: 20,
    effort: "easy",
    fun_mode: "straightforward",
    estimatedDistanceM: 500,
    description: "500m easy continuous freestyle, relaxed technique focus.",
  },
  {
    id: "week2_mon_20min_4x5",
    label: "20 min free, 4x5 min (repeat)",
    durationBucket: 20,
    effort: "easy",
    fun_mode: "straightforward",
    estimatedDistanceM: 800,
    description:
      "20 min freestyle easy effort: 4 x 5 min swim with 2 min easy recovery between each block.",
  },
  {
    id: "week2_tue_8x75",
    label: "8x75m steady",
    durationBucket: 20,
    effort: "medium",
    fun_mode: "straightforward",
    estimatedDistanceM: 600,
    description: "8 x 75m steady effort with 30 sec recovery.",
  },
  {
    id: "week2_sat_600",
    label: "600m easy continuous",
    durationBucket: 20,
    effort: "easy",
    fun_mode: "straightforward",
    estimatedDistanceM: 600,
    description: "600m easy continuous freestyle.",
  },
  {
    id: "week3_mon_30min_3x10",
    label: "30 min free, 3x10 min",
    durationBucket: 30,
    effort: "easy",
    fun_mode: "straightforward",
    estimatedDistanceM: 1200,
    description:
      "30 min freestyle easy effort: 3 x 10 min swim with 2–3 min easy recovery between blocks.",
  },
  {
    id: "week3_tue_5x100_plus_fast",
    label: "5x100m + 100m fast",
    durationBucket: 30,
    effort: "hard",
    fun_mode: "fun",
    estimatedDistanceM: 600,
    description:
      "5 x 100m with 30 sec recovery, then 90 sec easy recovery and finish with 100m fast recording time.",
  },
  {
    id: "week3_sat_800",
    label: "800m easy continuous",
    durationBucket: 30,
    effort: "easy",
    fun_mode: "straightforward",
    estimatedDistanceM: 800,
    description: "800m easy continuous freestyle.",
  },
  {
    id: "week4_mon_30min_3x10",
    label: "30 min free, 3x10 min (repeat)",
    durationBucket: 30,
    effort: "easy",
    fun_mode: "straightforward",
    estimatedDistanceM: 1200,
    description:
      "30 min freestyle easy effort: 3 x 10 min swim with 2–3 min easy recovery between blocks.",
  },
  {
    id: "week4_tue_6x100_plus_fast",
    label: "6x100m steady + 100m fast",
    durationBucket: 30,
    effort: "hard",
    fun_mode: "fun",
    estimatedDistanceM: 700,
    description:
      "6 x 100m steady effort with 30 sec recovery, then 90 sec easy recovery and 100m fast recording time.",
  },
  {
    id: "week4_sat_900",
    label: "900m easy continuous",
    durationBucket: 30,
    effort: "easy",
    fun_mode: "straightforward",
    estimatedDistanceM: 900,
    description: "900m easy continuous freestyle.",
  },
  {
    id: "week5_mon_30min_3x10",
    label: "30 min free, 3x10 min, shorter rest",
    durationBucket: 30,
    effort: "medium",
    fun_mode: "straightforward",
    estimatedDistanceM: 1200,
    description:
      "30 min freestyle easy effort: 3 x 10 min swim with 90 sec easy recovery between blocks.",
  },
  {
    id: "week5_tue_30min_far_as_can",
    label: "30 min, go as far as you can",
    durationBucket: 30,
    effort: "hard",
    fun_mode: "fun",
    estimatedDistanceM: 1400,
    description:
      "30 min continuous swim, go as far as you can whilst maintaining control and good form.",
  },
  {
    id: "week5_sat_700",
    label: "700m easy continuous",
    durationBucket: 20,
    effort: "easy",
    fun_mode: "straightforward",
    estimatedDistanceM: 700,
    description: "700m easy continuous freestyle.",
  },
  {
    id: "week6_mon_30min_easy",
    label: "30 min easy continuous",
    durationBucket: 30,
    effort: "easy",
    fun_mode: "straightforward",
    estimatedDistanceM: 1200,
    description: "30 min continuous easy-effort swim.",
  },
  {
    id: "week6_tue_6x150_plus_fast",
    label: "6x150m steady + 100m fast",
    durationBucket: 30,
    effort: "hard",
    fun_mode: "fun",
    estimatedDistanceM: 1000,
    description:
      "6 x 150m steady effort with 20 sec recovery, then 90 sec easy recovery and 100m fast recording time.",
  },
  {
    id: "week6_sat_800",
    label: "800m easy continuous (repeat)",
    durationBucket: 30,
    effort: "easy",
    fun_mode: "straightforward",
    estimatedDistanceM: 800,
    description: "800m easy continuous freestyle.",
  },
  {
    id: "week7_mon_30min_easy",
    label: "30 min easy continuous (repeat)",
    durationBucket: 30,
    effort: "easy",
    fun_mode: "straightforward",
    estimatedDistanceM: 1200,
    description: "30 min continuous easy-effort swim.",
  },
  {
    id: "week7_tue_5x200",
    label: "5x200m steady",
    durationBucket: 30,
    effort: "medium",
    fun_mode: "straightforward",
    estimatedDistanceM: 1000,
    description: "5 x 200m steady effort with 30 sec recovery.",
  },
  {
    id: "week7_sat_1000",
    label: "1000m easy continuous",
    durationBucket: 30,
    effort: "easy",
    fun_mode: "straightforward",
    estimatedDistanceM: 1000,
    description: "1000m easy continuous freestyle.",
  },
  {
    id: "week8_mon_35min_easy",
    label: "35 min easy continuous",
    durationBucket: 30,
    effort: "medium",
    fun_mode: "straightforward",
    estimatedDistanceM: 1400,
    description: "35 min continuous easy-effort swim.",
  },
  {
    id: "week8_tue_6x200",
    label: "6x200m steady",
    durationBucket: 30,
    effort: "medium",
    fun_mode: "straightforward",
    estimatedDistanceM: 1200,
    description: "6 x 200m steady effort with 30 sec recovery.",
  },
  {
    id: "week8_sat_1200",
    label: "1200m easy continuous",
    durationBucket: 30,
    effort: "easy",
    fun_mode: "straightforward",
    estimatedDistanceM: 1200,
    description: "1200m easy continuous freestyle.",
  },
  {
    id: "week9_mon_40min_2x20",
    label: "40 min easy, 2x20 min",
    durationBucket: 30,
    effort: "medium",
    fun_mode: "straightforward",
    estimatedDistanceM: 1600,
    description:
      "40 min easy effort: 2 x 20 min swim with 5 min easy recovery between blocks.",
  },
  {
    id: "week9_tue_30_40min_far_as_can",
    label: "30–40 min, go as far as you can",
    durationBucket: 30,
    effort: "hard",
    fun_mode: "fun",
    estimatedDistanceM: 1800,
    description:
      "30–40 min continuous swim, go as far as you can whilst maintaining control and good form.",
  },
  {
    id: "week9_sat_1300",
    label: "1300m easy continuous",
    durationBucket: 30,
    effort: "easy",
    fun_mode: "straightforward",
    estimatedDistanceM: 1300,
    description: "1300m easy continuous freestyle.",
  },
  {
    id: "week10_mon_40min_easy",
    label: "40 min easy continuous",
    durationBucket: 30,
    effort: "medium",
    fun_mode: "straightforward",
    estimatedDistanceM: 1600,
    description: "40 min continuous easy-effort swim.",
  },
  {
    id: "week10_tue_8_10x100_race_pace",
    label: "8–10x100m race pace",
    durationBucket: 30,
    effort: "hard",
    fun_mode: "fun",
    estimatedDistanceM: 1000,
    description:
      "8–10 x 100m at race pace with 15–20 sec recovery between each 100m.",
  },
  {
    id: "week10_sat_1200",
    label: "1200m easy continuous (repeat)",
    durationBucket: 30,
    effort: "easy",
    fun_mode: "straightforward",
    estimatedDistanceM: 1200,
    description: "1200m easy continuous freestyle.",
  },
  {
    id: "week11_mon_30min_easy",
    label: "30 min easy continuous (taper)",
    durationBucket: 30,
    effort: "easy",
    fun_mode: "straightforward",
    estimatedDistanceM: 1200,
    description: "30 min continuous easy-effort swim.",
  },
  {
    id: "week11_tue_30min_continuous",
    label: "30 min continuous easy freestyle",
    durationBucket: 30,
    effort: "easy",
    fun_mode: "straightforward",
    estimatedDistanceM: 1200,
    description: "30 min continuous easy freestyle.",
  },
  {
    id: "week11_sat_700",
    label: "700m easy continuous (taper)",
    durationBucket: 20,
    effort: "easy",
    fun_mode: "straightforward",
    estimatedDistanceM: 700,
    description: "700m easy continuous freestyle.",
  },
  {
    id: "week12_thu_20min_continuous",
    label: "20 min continuous easy freestyle",
    durationBucket: 20,
    effort: "easy",
    fun_mode: "straightforward",
    estimatedDistanceM: 800,
    description: "20 min continuous easy-effort freestyle.",
  },
];

function getRecentSessionIds(
  history: GeneratorHistory,
  lookbackPlans = 5,
): Set<string> {
  const recent = history.acceptedPlans
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
    .slice(0, lookbackPlans);

  const ids = new Set<string>();
  for (const plan of recent) {
    for (const segment of plan.plan.segments) {
      ids.add(segment.id);
    }
  }
  return ids;
}

function pickSessionForRequest(
  request: PlanRequest,
  history: GeneratorHistory,
): SwimSessionDefinition {
  const recentIds = getRecentSessionIds(history);

  const byDuration = SESSION_LIBRARY.filter(
    (s) => s.durationBucket === request.duration_minutes,
  );

  const byEffort = byDuration.filter(
    (s) => s.effort === request.effort || request.effort === "medium",
  );

  const byFunMode = byEffort.filter(
    (s) => s.fun_mode === request.fun_mode || s.fun_mode === "either",
  );

  const basePool =
    byFunMode.length > 0
      ? byFunMode
      : byEffort.length > 0
        ? byEffort
        : byDuration.length > 0
          ? byDuration
          : SESSION_LIBRARY;

  const notRecentlyUsed = basePool.filter((s) => !recentIds.has(s.id));
  const pool = notRecentlyUsed.length > 0 ? notRecentlyUsed : basePool;

  const index = Math.floor(Math.random() * pool.length);
  return pool[index];
}

export function generatePlan(
  profile: Profile,
  request: PlanRequest,
  history: GeneratorHistory,
): GeneratedPlan {
  const session = pickSessionForRequest(request, history);

  const segment: PlanSegment = {
    id: session.id,
    type: "session",
    distance_m: session.estimatedDistanceM,
    stroke: "mixed",
    description: session.description,
    effort: session.effort,
  };

  return {
    duration_minutes: request.duration_minutes,
    estimated_distance_m: session.estimatedDistanceM,
    segments: [segment],
    notes: session.label,
    metadata: {
      version: "v1",
      swim_level: profile.swim_level,
      input_effort: request.effort,
      input_fun_mode: request.fun_mode,
    },
  };
}

