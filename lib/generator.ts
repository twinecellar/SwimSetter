export type SwimLevel = 'beginner' | 'intermediate' | 'advanced';
export type EffortLevel = 'easy' | 'medium' | 'hard';
export type FunMode = 'straightforward' | 'fun';

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
  type: 'warmup' | 'technique' | 'endurance' | 'speed' | 'cooldown';
  distance_m: number;
  stroke: 'freestyle' | 'backstroke' | 'breaststroke' | 'butterfly' | 'mixed';
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
    version: 'v1';
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

type TemplateKey = `${SwimLevel}_${20 | 30}_${EffortLevel}`;

interface TemplateDefinition {
  baseSegments: PlanSegment[];
}

const BASE_TEMPLATES: Record<TemplateKey, TemplateDefinition> = {
  beginner_20_easy: {
    baseSegments: [
      {
        id: 'warmup_easy_200_free',
        type: 'warmup',
        distance_m: 200,
        stroke: 'freestyle',
        description: '4 x 50m easy freestyle, 15s rest',
        effort: 'easy'
      },
      {
        id: 'technique_4x25_drill',
        type: 'technique',
        distance_m: 100,
        stroke: 'freestyle',
        description: '4 x 25m choice drill, 20s rest',
        effort: 'easy'
      },
      {
        id: 'cooldown_easy_100_free',
        type: 'cooldown',
        distance_m: 100,
        stroke: 'freestyle',
        description: '100m easy freestyle, relaxed breathing',
        effort: 'easy'
      }
    ]
  },
  beginner_20_medium: {
    baseSegments: [
      {
        id: 'warmup_200_mix_easy',
        type: 'warmup',
        distance_m: 200,
        stroke: 'mixed',
        description: '100m easy free + 100m backstroke',
        effort: 'easy'
      },
      {
        id: 'endurance_4x50_steady',
        type: 'endurance',
        distance_m: 200,
        stroke: 'freestyle',
        description: '4 x 50m steady freestyle, 20s rest',
        effort: 'medium'
      },
      {
        id: 'cooldown_100_choice',
        type: 'cooldown',
        distance_m: 100,
        stroke: 'mixed',
        description: '100m easy choice stroke',
        effort: 'easy'
      }
    ]
  },
  beginner_20_hard: {
    baseSegments: [
      {
        id: 'warmup_200_free_buoy',
        type: 'warmup',
        distance_m: 200,
        stroke: 'freestyle',
        description: '200m easy freestyle with pull buoy',
        effort: 'easy'
      },
      {
        id: 'speed_8x25_build',
        type: 'speed',
        distance_m: 200,
        stroke: 'freestyle',
        description: '8 x 25m build to fast, 20s rest',
        effort: 'hard'
      },
      {
        id: 'cooldown_100_back',
        type: 'cooldown',
        distance_m: 100,
        stroke: 'backstroke',
        description: '100m easy backstroke',
        effort: 'easy'
      }
    ]
  },
  beginner_30_easy: {
    baseSegments: [
      {
        id: 'warmup_300_mix_easy',
        type: 'warmup',
        distance_m: 300,
        stroke: 'mixed',
        description: '3 x 100m easy (free, back, free), 15s rest',
        effort: 'easy'
      },
      {
        id: 'technique_4x50_drill_swim',
        type: 'technique',
        distance_m: 200,
        stroke: 'freestyle',
        description: '4 x 50m (25 drill / 25 swim), 20s rest',
        effort: 'easy'
      },
      {
        id: 'cooldown_100_choice_long',
        type: 'cooldown',
        distance_m: 100,
        stroke: 'mixed',
        description: '100m very easy choice stroke',
        effort: 'easy'
      }
    ]
  },
  beginner_30_medium: {
    baseSegments: [
      {
        id: 'warmup_300_free_easy',
        type: 'warmup',
        distance_m: 300,
        stroke: 'freestyle',
        description: '300m easy freestyle, breathe every 3 strokes',
        effort: 'easy'
      },
      {
        id: 'endurance_6x50_steady',
        type: 'endurance',
        distance_m: 300,
        stroke: 'freestyle',
        description: '6 x 50m steady freestyle, 20s rest',
        effort: 'medium'
      },
      {
        id: 'cooldown_100_choice',
        type: 'cooldown',
        distance_m: 100,
        stroke: 'mixed',
        description: '100m easy choice stroke',
        effort: 'easy'
      }
    ]
  },
  beginner_30_hard: {
    baseSegments: [
      {
        id: 'warmup_300_mix',
        type: 'warmup',
        distance_m: 300,
        stroke: 'mixed',
        description: '3 x 100m (50 free / 50 back), 15s rest',
        effort: 'easy'
      },
      {
        id: 'speed_8x25_fast',
        type: 'speed',
        distance_m: 200,
        stroke: 'freestyle',
        description: '8 x 25m fast, 25s rest',
        effort: 'hard'
      },
      {
        id: 'endurance_4x50_steady',
        type: 'endurance',
        distance_m: 200,
        stroke: 'freestyle',
        description: '4 x 50m steady freestyle, 20s rest',
        effort: 'medium'
      },
      {
        id: 'cooldown_100_back',
        type: 'cooldown',
        distance_m: 100,
        stroke: 'backstroke',
        description: '100m easy backstroke',
        effort: 'easy'
      }
    ]
  },
  intermediate_20_easy: {
    baseSegments: [
      {
        id: 'warmup_300_free',
        type: 'warmup',
        distance_m: 300,
        stroke: 'freestyle',
        description: '300m easy freestyle, build last 50m',
        effort: 'easy'
      },
      {
        id: 'technique_4x50_choice',
        type: 'technique',
        distance_m: 200,
        stroke: 'mixed',
        description: '4 x 50m choice drill/swim, 15s rest',
        effort: 'easy'
      }
    ]
  },
  intermediate_20_medium: {
    baseSegments: [
      {
        id: 'warmup_200_free_100_kick',
        type: 'warmup',
        distance_m: 300,
        stroke: 'mixed',
        description: '200m easy free + 100m flutter kick',
        effort: 'easy'
      },
      {
        id: 'endurance_6x50_thresh',
        type: 'endurance',
        distance_m: 300,
        stroke: 'freestyle',
        description: '6 x 50m at threshold pace, 20s rest',
        effort: 'medium'
      }
    ]
  },
  intermediate_20_hard: {
    baseSegments: [
      {
        id: 'warmup_300_mix',
        type: 'warmup',
        distance_m: 300,
        stroke: 'mixed',
        description: '300m mix of free/back, last 50 strong',
        effort: 'easy'
      },
      {
        id: 'speed_8x25_sprint',
        type: 'speed',
        distance_m: 200,
        stroke: 'freestyle',
        description: '8 x 25m sprint from push, 30s rest',
        effort: 'hard'
      }
    ]
  },
  intermediate_30_easy: {
    baseSegments: [
      {
        id: 'warmup_400_free',
        type: 'warmup',
        distance_m: 400,
        stroke: 'freestyle',
        description: '400m easy freestyle, focus on technique',
        effort: 'easy'
      },
      {
        id: 'technique_4x50_drill_swim',
        type: 'technique',
        distance_m: 200,
        stroke: 'mixed',
        description: '4 x 50m (25 drill / 25 swim), 20s rest',
        effort: 'easy'
      },
      {
        id: 'cooldown_100_choice',
        type: 'cooldown',
        distance_m: 100,
        stroke: 'mixed',
        description: '100m easy choice stroke',
        effort: 'easy'
      }
    ]
  },
  intermediate_30_medium: {
    baseSegments: [
      {
        id: 'warmup_300_free',
        type: 'warmup',
        distance_m: 300,
        stroke: 'freestyle',
        description: '300m easy freestyle',
        effort: 'easy'
      },
      {
        id: 'endurance_8x50_steady',
        type: 'endurance',
        distance_m: 400,
        stroke: 'freestyle',
        description: '8 x 50m steady, 20s rest',
        effort: 'medium'
      },
      {
        id: 'cooldown_100_choice',
        type: 'cooldown',
        distance_m: 100,
        stroke: 'mixed',
        description: '100m easy choice stroke',
        effort: 'easy'
      }
    ]
  },
  intermediate_30_hard: {
    baseSegments: [
      {
        id: 'warmup_300_mix',
        type: 'warmup',
        distance_m: 300,
        stroke: 'mixed',
        description: '300m mix free/back, last 50 build',
        effort: 'easy'
      },
      {
        id: 'speed_12x25_fast',
        type: 'speed',
        distance_m: 300,
        stroke: 'freestyle',
        description: '12 x 25m fast, 25s rest',
        effort: 'hard'
      },
      {
        id: 'cooldown_100_choice',
        type: 'cooldown',
        distance_m: 100,
        stroke: 'mixed',
        description: '100m easy choice stroke',
        effort: 'easy'
      }
    ]
  },
  advanced_20_easy: {
    baseSegments: [
      {
        id: 'warmup_400_free',
        type: 'warmup',
        distance_m: 400,
        stroke: 'freestyle',
        description: '400m easy freestyle with breathing focus',
        effort: 'easy'
      },
      {
        id: 'technique_4x50_drill',
        type: 'technique',
        distance_m: 200,
        stroke: 'mixed',
        description: '4 x 50m choice drill, 15s rest',
        effort: 'easy'
      }
    ]
  },
  advanced_20_medium: {
    baseSegments: [
      {
        id: 'warmup_300_free_100_kick',
        type: 'warmup',
        distance_m: 400,
        stroke: 'mixed',
        description: '300m free + 100m kick',
        effort: 'easy'
      },
      {
        id: 'endurance_6x75_threshold',
        type: 'endurance',
        distance_m: 450,
        stroke: 'freestyle',
        description: '6 x 75m at threshold pace, 20s rest',
        effort: 'medium'
      }
    ]
  },
  advanced_20_hard: {
    baseSegments: [
      {
        id: 'warmup_400_mix',
        type: 'warmup',
        distance_m: 400,
        stroke: 'mixed',
        description: '400m mix free/IM, last 50 strong',
        effort: 'easy'
      },
      {
        id: 'speed_8x50_sprint',
        type: 'speed',
        distance_m: 400,
        stroke: 'freestyle',
        description: '8 x 50m sprint, 30s rest',
        effort: 'hard'
      }
    ]
  },
  advanced_30_easy: {
    baseSegments: [
      {
        id: 'warmup_600_free',
        type: 'warmup',
        distance_m: 600,
        stroke: 'freestyle',
        description: '600m easy freestyle, descend each 200m',
        effort: 'easy'
      },
      {
        id: 'technique_4x50_drill_swim',
        type: 'technique',
        distance_m: 200,
        stroke: 'mixed',
        description: '4 x 50m (25 drill / 25 swim), 15s rest',
        effort: 'easy'
      },
      {
        id: 'cooldown_100_choice',
        type: 'cooldown',
        distance_m: 100,
        stroke: 'mixed',
        description: '100m very easy choice',
        effort: 'easy'
      }
    ]
  },
  advanced_30_medium: {
    baseSegments: [
      {
        id: 'warmup_400_free_200_kick',
        type: 'warmup',
        distance_m: 600,
        stroke: 'mixed',
        description: '400m free + 200m kick',
        effort: 'easy'
      },
      {
        id: 'endurance_8x75_thresh',
        type: 'endurance',
        distance_m: 600,
        stroke: 'freestyle',
        description: '8 x 75m at threshold pace, 20s rest',
        effort: 'medium'
      }
    ]
  },
  advanced_30_hard: {
    baseSegments: [
      {
        id: 'warmup_400_mix',
        type: 'warmup',
        distance_m: 400,
        stroke: 'mixed',
        description: '400m mix free/IM, last 50 strong',
        effort: 'easy'
      },
      {
        id: 'speed_12x50_fast',
        type: 'speed',
        distance_m: 600,
        stroke: 'freestyle',
        description: '12 x 50m fast, 25s rest',
        effort: 'hard'
      },
      {
        id: 'cooldown_100_choice',
        type: 'cooldown',
        distance_m: 100,
        stroke: 'mixed',
        description: '100m easy choice',
        effort: 'easy'
      }
    ]
  }
};

function getTemplateKey(profile: Profile, request: PlanRequest): TemplateKey {
  return `${profile.swim_level}_${request.duration_minutes}_${request.effort}` as TemplateKey;
}

function getRecentSegmentIds(history: GeneratorHistory, lookbackPlans = 5): Set<string> {
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

function filterSegmentsForFunMode(
  segments: PlanSegment[],
  funMode: FunMode
): PlanSegment[] {
  if (funMode === 'straightforward') {
    return segments.filter(
      (s) => s.type === 'warmup' || s.type === 'endurance' || s.type === 'cooldown'
    );
  }

  return segments;
}

export function generatePlan(
  profile: Profile,
  request: PlanRequest,
  history: GeneratorHistory
): GeneratedPlan {
  const key = getTemplateKey(profile, request);
  const template = BASE_TEMPLATES[key];

  const baseSegments = template ? template.baseSegments : BASE_TEMPLATES['beginner_20_easy'].baseSegments;

  const recentSegmentIds = getRecentSegmentIds(history);
  const funFiltered = filterSegmentsForFunMode(baseSegments, request.fun_mode);

  const segments: PlanSegment[] = funFiltered.map((segment) => {
    if (recentSegmentIds.has(segment.id)) {
      return {
        ...segment,
        description: `${segment.description} (focus on a slightly different detail today)`
      };
    }
    return segment;
  });

  const estimated_distance_m = segments.reduce(
    (total, seg) => total + seg.distance_m,
    0
  );

  return {
    duration_minutes: request.duration_minutes,
    estimated_distance_m,
    segments,
    metadata: {
      version: 'v1',
      swim_level: profile.swim_level,
      input_effort: request.effort,
      input_fun_mode: request.fun_mode
    }
  };
}

