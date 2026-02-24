export type Effort = "easy" | "medium" | "hard";
export type FunMode = "straightforward" | "fun";
export type PlanStatus = "generated" | "accepted" | "completed";

export interface PlanRequest {
  duration_minutes: 20 | 30;
  effort: Effort;
  fun_mode: FunMode;
}

export interface PlanSegment {
  id: string;
  type: string;
  distance_m: number;
  stroke: string;
  description: string;
  effort: Effort;
}

export interface GeneratedPlan {
  duration_minutes: number;
  estimated_distance_m: number;
  segments: PlanSegment[];
  metadata: {
    version: string;
    swim_level: string;
    input_effort: Effort;
    input_fun_mode: FunMode;
  };
}

export interface PlanRow {
  id: string;
  created_at: string;
  status: Exclude<PlanStatus, "generated">;
  request: PlanRequest;
  plan: GeneratedPlan;
}

export interface CompletionRow {
  plan_id: string;
  rating: number | null;
  tags: string[];
  notes: string | null;
  completed_at: string;
}
