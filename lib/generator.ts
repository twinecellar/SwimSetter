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

type SessionId = string;

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
  // Beginner 2 mile highlights
  {
    id: "b2_week2_mon_25min_5x5",
    label: "25 min free, 5x5 min",
    durationBucket: 30,
    effort: "easy",
    fun_mode: "straightforward",
    estimatedDistanceM: 1000,
    description:
      "25 min freestyle easy effort: 5 x 5 min swim with 2 min easy recovery between blocks.",
  },
  {
    id: "b2_week2_tue_8x100",
    label: "8x100m steady",
    durationBucket: 30,
    effort: "medium",
    fun_mode: "straightforward",
    estimatedDistanceM: 800,
    description: "8 x 100m steady effort with 60 sec recovery.",
  },
  {
    id: "b2_week3_tue_4x200_plus_100_fast",
    label: "4x200m + 100m fast",
    durationBucket: 30,
    effort: "hard",
    fun_mode: "fun",
    estimatedDistanceM: 900,
    description:
      "4 x 200m with 90 sec recovery, then 90 sec easy recovery and finish with 100m fast recording time.",
  },
  {
    id: "b2_week6_mon_15min_plus_5x100",
    label: "15 min easy + 5x100m controlled",
    durationBucket: 20,
    effort: "medium",
    fun_mode: "straightforward",
    estimatedDistanceM: 1000,
    description:
      "15 mins easy effort with 3 min recovery, then 5 x 100m controlled effort with 90 sec recovery.",
  },
  {
    id: "b2_week7_mon_40min_8x5",
    label: "40 min free, 8x5 min",
    durationBucket: 30,
    effort: "medium",
    fun_mode: "straightforward",
    estimatedDistanceM: 1600,
    description:
      "40 mins freestyle, easy effort with 8 x 5 min swim and 2 min easy recovery.",
  },
  {
    id: "b2_week7_sat_1400",
    label: "1400m easy continuous",
    durationBucket: 30,
    effort: "easy",
    fun_mode: "straightforward",
    estimatedDistanceM: 1400,
    description: "1400m easy continuous freestyle.",
  },
  {
    id: "b2_week8_sat_750",
    label: "750m easy continuous",
    durationBucket: 20,
    effort: "easy",
    fun_mode: "straightforward",
    estimatedDistanceM: 750,
    description: "750m easy continuous freestyle.",
  },
  {
    id: "b2_week10_mon_20min_plus_5x100",
    label: "20 min easy + 5x100m controlled",
    durationBucket: 20,
    effort: "medium",
    fun_mode: "straightforward",
    estimatedDistanceM: 1100,
    description:
      "20 mins easy effort with 3 min recovery, then 5 x 100m controlled effort with 90 sec recovery.",
  },
  {
    id: "b2_week10_tue_10_12x100_race_pace",
    label: "10–12x100m race pace",
    durationBucket: 30,
    effort: "hard",
    fun_mode: "fun",
    estimatedDistanceM: 1200,
    description:
      "10–12 x 100m at race pace with 30–60 sec recovery between sets.",
  },
  {
    id: "b2_week10_sat_1800_2000",
    label: "1800–2000m easy continuous",
    durationBucket: 30,
    effort: "easy",
    fun_mode: "straightforward",
    estimatedDistanceM: 1900,
    description: "1800–2000m easy continuous freestyle.",
  },
  {
    id: "b2_week12_tue_3x100",
    label: "3x100m controlled",
    durationBucket: 20,
    effort: "medium",
    fun_mode: "straightforward",
    estimatedDistanceM: 300,
    description: "3 x 100m controlled effort with 90 sec recovery.",
  },
  // Beginner 5km highlights
  {
    id: "b5k_week1_tue_6x100",
    label: "6x100m steady",
    durationBucket: 20,
    effort: "medium",
    fun_mode: "straightforward",
    estimatedDistanceM: 600,
    description: "6 x 100m steady effort with 30–60 sec recovery.",
  },
  {
    id: "b5k_week2_tue_10x100",
    label: "10x100m steady",
    durationBucket: 30,
    effort: "medium",
    fun_mode: "straightforward",
    estimatedDistanceM: 1000,
    description: "10 x 100m steady effort with 60 sec recovery.",
  },
  {
    id: "b5k_week3_tue_8x200",
    label: "8x200m steady",
    durationBucket: 30,
    effort: "medium",
    fun_mode: "straightforward",
    estimatedDistanceM: 1600,
    description:
      "8 x 200m steady effort with 90 sec recovery and an additional 90 sec easy recovery.",
  },
  {
    id: "b5k_week5_mon_40min_4x10",
    label: "40 min free, 4x10 min",
    durationBucket: 30,
    effort: "medium",
    fun_mode: "straightforward",
    estimatedDistanceM: 1600,
    description:
      "40 mins freestyle easy effort: 4 x 10 min swim with 90 sec easy recovery.",
  },
  {
    id: "b5k_week6_tue_10x150_plus_fast",
    label: "10x150m steady + 100m fast",
    durationBucket: 30,
    effort: "hard",
    fun_mode: "fun",
    estimatedDistanceM: 1600,
    description:
      "10 x 150m steady effort with 20 sec recovery, then 90 sec recovery and 100m fast recording time.",
  },
  {
    id: "b5k_week6_sat_2000",
    label: "2000m easy continuous",
    durationBucket: 30,
    effort: "easy",
    fun_mode: "straightforward",
    estimatedDistanceM: 2000,
    description: "2000m easy continuous freestyle.",
  },
  {
    id: "b5k_week7_mon_20min_plus_5x150",
    label: "20 min continuous + 5x150m",
    durationBucket: 30,
    effort: "medium",
    fun_mode: "straightforward",
    estimatedDistanceM: 1700,
    description:
      "20 mins continuous easy effort, 3 min recovery, then 5 x 150m steady effort with 30 sec recovery.",
  },
  {
    id: "b5k_week7_tue_45min_9x5",
    label: "45 min free, 9x5 min",
    durationBucket: 30,
    effort: "medium",
    fun_mode: "straightforward",
    estimatedDistanceM: 1800,
    description:
      "45 mins freestyle easy effort with 9 x 5 min swim and 1 min easy recovery.",
  },
  {
    id: "b5k_week7_sat_2400",
    label: "2400m easy continuous",
    durationBucket: 30,
    effort: "easy",
    fun_mode: "straightforward",
    estimatedDistanceM: 2400,
    description: "2400m easy continuous freestyle.",
  },
  {
    id: "b5k_week9_sat_3000",
    label: "3000m easy continuous",
    durationBucket: 30,
    effort: "easy",
    fun_mode: "straightforward",
    estimatedDistanceM: 3000,
    description: "3000m easy continuous freestyle.",
  },
  {
    id: "b5k_week10_sat_3500",
    label: "3500m easy continuous",
    durationBucket: 30,
    effort: "easy",
    fun_mode: "straightforward",
    estimatedDistanceM: 3500,
    description: "3500m easy continuous freestyle.",
  },
  {
    id: "b5k_week11_mon_60min_easy",
    label: "60 min easy continuous",
    durationBucket: 30,
    effort: "medium",
    fun_mode: "straightforward",
    estimatedDistanceM: 3000,
    description: "60 mins continuous easy-effort swim.",
  },
  {
    id: "b5k_week12_thu_15min_continuous",
    label: "15 min continuous easy freestyle",
    durationBucket: 20,
    effort: "easy",
    fun_mode: "straightforward",
    estimatedDistanceM: 600,
    description: "15 mins freestyle continuous easy effort.",
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
