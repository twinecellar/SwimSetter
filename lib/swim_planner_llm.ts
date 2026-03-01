import { generateSwimPlan } from './swim-planner/generate';
import type { SwimPlanInput } from './swim-planner/types';

// ── Public types (unchanged — consumed by app/api/plans/generate/route.ts) ────

export interface SwimPlannerSessionRequested {
  duration_minutes: number;
  effort: 'easy' | 'medium' | 'hard';
  requested_tags: string[];
  swim_level?: 'beginner' | 'intermediate' | 'advanced';
}

export interface SwimPlannerHistoricSession {
  session_plan: {
    duration_minutes: number;
    estimated_distance_m: number;
  };
  thumb: 0 | 1;
  tags: string[];
}

export interface SwimPlannerPayload {
  session_requested: SwimPlannerSessionRequested;
  historic_sessions: SwimPlannerHistoricSession[];
  requested_tags: string[];
}

export interface SwimPlannerStep {
  step_id: string;
  kind: 'continuous' | 'intervals';
  reps: number;
  distance_per_rep_m: number;
  stroke: string;
  rest_seconds: number | null;
  effort: 'easy' | 'medium' | 'hard';
  description: string;
}

export interface SwimPlannerSection {
  title: string;
  section_distance_m: number;
  steps: SwimPlannerStep[];
}

export interface SwimPlannerResponse {
  plan_id: string;
  created_at: string;
  duration_minutes: number;
  estimated_distance_m: number;
  sections: {
    warm_up: SwimPlannerSection;
    main_set: SwimPlannerSection;
    cool_down: SwimPlannerSection;
  };
}

// ── Implementation ────────────────────────────────────────────────────────────

export async function runSwimPlannerLLM(
  payload: SwimPlannerPayload,
): Promise<SwimPlannerResponse> {
  const input: SwimPlanInput = {
    session_requested: payload.session_requested,
    historic_sessions: payload.historic_sessions,
    requested_tags: payload.requested_tags,
  };
  const plan = await generateSwimPlan(input);
  return plan as SwimPlannerResponse;
}
