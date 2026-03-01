// ── Shared enums ─────────────────────────────────────────────────────────────

export type Effort = 'easy' | 'medium' | 'hard';
export type StepKind =
  | 'continuous'
  | 'intervals'
  | 'pyramid'
  | 'descending'
  | 'ascending'
  | 'build'
  | 'negative_split';
export type Stroke =
  | 'freestyle'
  | 'backstroke'
  | 'breaststroke'
  | 'butterfly'
  | 'mixed'
  | 'choice';

// ── Input types ───────────────────────────────────────────────────────────────

export interface SessionRequested {
  duration_minutes: number;
  effort: Effort;
  requested_tags: string[];
}

export interface HistoricSession {
  session_plan: {
    duration_minutes: number;
    estimated_distance_m: number;
  };
  thumb: 0 | 1;
  tags: string[];
}

export interface SwimPlanInput {
  session_requested: SessionRequested;
  historic_sessions: HistoricSession[];
  requested_tags: string[];
}

// ── Lenient draft types (for parsing raw LLM output) ─────────────────────────
// Fields are optional to tolerate imperfect LLM responses; unknown keys ignored.

export interface StepDraft {
  step_id?: string | null;
  kind?: string | null;
  reps?: number | null;
  distance_per_rep_m?: number | null;
  pyramid_sequence_m?: number[] | null;
  stroke?: string | null;
  rest_seconds?: number | null;
  effort?: string | null;
  description?: string | null;
  hypoxic?: boolean | null;
  split_instruction?: string | null;
}

export interface SectionDraft {
  title?: string | null;
  section_distance_m?: number | null;
  steps?: StepDraft[] | null;
}

export interface LLMPlanDraft {
  plan_id?: string | null;
  created_at?: string | null;
  duration_minutes?: number | null;
  estimated_distance_m?: number | null;
  sections?: {
    warm_up?: SectionDraft | null;
    main_set?: SectionDraft | null;
    cool_down?: SectionDraft | null;
  } | null;
}

// ── Strict output types ───────────────────────────────────────────────────────

export interface Step {
  step_id: string;
  kind: StepKind;
  reps: number;
  distance_per_rep_m: number;
  pyramid_sequence_m?: number[];
  stroke: Stroke;
  rest_seconds: number | null;
  effort: Effort;
  description: string;
  hypoxic?: boolean;
  split_instruction?: string;
}

const PYRAMID_KINDS = new Set<StepKind>(['pyramid', 'descending', 'ascending']);

export function stepDistanceM(step: Step): number {
  if (PYRAMID_KINDS.has(step.kind) && step.pyramid_sequence_m && step.pyramid_sequence_m.length > 0) {
    return step.pyramid_sequence_m.reduce((sum, d) => sum + d, 0);
  }
  return step.reps * step.distance_per_rep_m;
}

export interface Section {
  title: string;
  section_distance_m: number;
  steps: Step[];
}

export interface SwimPlanResponse {
  plan_id: string;
  created_at: string;
  duration_minutes: number;
  estimated_distance_m: number;
  sections: {
    warm_up: Section;
    main_set: Section;
    cool_down: Section;
  };
}
