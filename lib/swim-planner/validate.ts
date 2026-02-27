// Port of swim_planner_llm/validator.py

import type {
  Effort,
  HistoricSession,
  LLMPlanDraft,
  Section,
  SessionRequested,
  Step,
  StepKind,
  Stroke,
  SwimPlanResponse,
} from './types';
import { stepDistanceM } from './types';
import { inferPreferVaried } from './style-inference';

export class ValidationIssue extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationIssue';
  }
}

const ALLOWED_KINDS = new Set<string>(['continuous', 'intervals']);
const ALLOWED_STROKES = new Set<string>([
  'freestyle',
  'backstroke',
  'breaststroke',
  'butterfly',
  'mixed',
  'choice',
]);
const ALLOWED_EFFORTS = new Set<string>(['easy', 'medium', 'hard']);

// ── Step conversion ───────────────────────────────────────────────────────────

function convertSteps(rawSteps: unknown[] | null | undefined, prefix: string, defaultDesc: string): Step[] {
  if (!Array.isArray(rawSteps) || rawSteps.length === 0) {
    throw new ValidationIssue(`${prefix}: no steps provided`);
  }

  return rawSteps.map((s: any, idx) => {
    const stepId = (s?.step_id ?? '').toString().trim() || `${prefix}-${idx + 1}`;
    const description = (s?.description ?? '').toString().trim() || defaultDesc;

    return {
      step_id: stepId,
      kind: s?.kind as StepKind,
      reps: s?.reps,
      distance_per_rep_m: s?.distance_per_rep_m,
      stroke: s?.stroke as Stroke,
      rest_seconds: s?.rest_seconds ?? null,
      effort: s?.effort as Effort,
      description,
    };
  });
}

// ── Normalisation ─────────────────────────────────────────────────────────────

export function enforceAndNormalize(draft: LLMPlanDraft, request: SessionRequested): SwimPlanResponse {
  const secs = draft.sections;
  if (!secs) throw new ValidationIssue('sections missing from LLM output');

  const warmSteps = convertSteps(secs.warm_up?.steps, 'wu', 'Auto-generated warm-up step');
  const mainSteps = convertSteps(secs.main_set?.steps, 'main', 'Auto-generated main step');
  const coolSteps = convertSteps(secs.cool_down?.steps, 'cd', 'Auto-generated cool-down step');

  function makeSection(steps: Step[], fallbackTitle: string, providedTitle?: string | null): Section {
    return {
      title: (providedTitle ?? '').trim() || fallbackTitle,
      steps,
      section_distance_m: steps.reduce((sum, s) => sum + stepDistanceM(s), 0),
    };
  }

  const warm_up = makeSection(warmSteps, 'Warm-Up', secs.warm_up?.title);
  const main_set = makeSection(mainSteps, 'Main Set', secs.main_set?.title);
  const cool_down = makeSection(coolSteps, 'Cool-Down', secs.cool_down?.title);

  const estimated_distance_m =
    warm_up.section_distance_m + main_set.section_distance_m + cool_down.section_distance_m;

  const plan_id = draft.plan_id ?? crypto.randomUUID();
  const created_at = draft.created_at ?? new Date().toISOString();

  return {
    plan_id,
    created_at,
    duration_minutes: request.duration_minutes,
    estimated_distance_m,
    sections: { warm_up, main_set, cool_down },
  };
}

// ── Field validation ──────────────────────────────────────────────────────────

function validateStep(step: Step, sectionName: string): void {
  if (!ALLOWED_KINDS.has(step.kind)) {
    throw new ValidationIssue(`${sectionName}.${step.step_id}: invalid kind '${step.kind}'`);
  }
  if (!ALLOWED_STROKES.has(step.stroke)) {
    throw new ValidationIssue(`${sectionName}.${step.step_id}: invalid stroke '${step.stroke}'`);
  }
  if (!ALLOWED_EFFORTS.has(step.effort)) {
    throw new ValidationIssue(`${sectionName}.${step.step_id}: invalid effort '${step.effort}'`);
  }
  if (!(step.reps > 0)) {
    throw new ValidationIssue(`${sectionName}.${step.step_id}: reps must be > 0`);
  }
  if (!(step.distance_per_rep_m > 0)) {
    throw new ValidationIssue(`${sectionName}.${step.step_id}: distance_per_rep_m must be > 0`);
  }
  if (step.distance_per_rep_m % 50 !== 0) {
    throw new ValidationIssue(
      `${sectionName}.${step.step_id}: distance_per_rep_m must be divisible by 50`,
    );
  }
  const dist = stepDistanceM(step);
  if (dist <= 0) {
    throw new ValidationIssue(
      `${sectionName}.${step.step_id}: computed step distance must be > 0`,
    );
  }
  if (dist % 50 !== 0) {
    throw new ValidationIssue(
      `${sectionName}.${step.step_id}: computed step distance must be divisible by 50`,
    );
  }
  if (step.rest_seconds !== null && step.rest_seconds !== undefined && step.rest_seconds < 0) {
    throw new ValidationIssue(
      `${sectionName}.${step.step_id}: rest_seconds must be >= 0 or null`,
    );
  }
  if (!step.step_id.trim()) {
    throw new ValidationIssue(`${sectionName}: step_id must not be empty`);
  }
  if (!step.description.trim()) {
    throw new ValidationIssue(`${sectionName}.${step.step_id}: description must not be empty`);
  }
}

function validateSection(section: Section, sectionName: string): number {
  if (!section.title.trim()) {
    throw new ValidationIssue(`${sectionName}: title must not be empty`);
  }
  if (!section.steps || section.steps.length === 0) {
    throw new ValidationIssue(`${sectionName}: must contain at least one step`);
  }

  let stepSum = 0;
  for (const step of section.steps) {
    validateStep(step, sectionName);
    stepSum += stepDistanceM(step);
  }

  if (section.section_distance_m <= 0) {
    throw new ValidationIssue(`${sectionName}: section_distance_m must be > 0`);
  }
  if (section.section_distance_m % 50 !== 0) {
    throw new ValidationIssue(`${sectionName}: section_distance_m must be divisible by 50`);
  }
  if (stepSum !== section.section_distance_m) {
    throw new ValidationIssue(`${sectionName}: section_distance_m does not match step sum`);
  }

  return stepSum;
}

// ── Sensitive feedback detection ──────────────────────────────────────────────

function hasSensitiveDownFeedback(historicSessions: HistoricSession[]): boolean {
  const riskTags = new Set(['pace-too-fast', 'long', 'tiring']);
  for (const session of historicSessions) {
    if (session.thumb !== 0) continue;
    const tags = new Set(session.tags.map((t) => t.trim().toLowerCase()).filter(Boolean));
    if ([...tags].some((t) => riskTags.has(t))) return true;
  }
  return false;
}

// ── Step signature (for style check) ─────────────────────────────────────────

function stepSignature(step: Step): string {
  return JSON.stringify([
    step.kind,
    step.reps,
    step.distance_per_rep_m,
    step.stroke,
    step.rest_seconds,
    step.effort,
  ]);
}

// ── Public invariant check ────────────────────────────────────────────────────

export function validateInvariants(
  plan: SwimPlanResponse,
  request: SessionRequested,
  historicSessions: HistoricSession[],
  requestedTags: string[],
): void {
  const warmSum = validateSection(plan.sections.warm_up, 'warm_up');
  const mainSum = validateSection(plan.sections.main_set, 'main_set');
  const coolSum = validateSection(plan.sections.cool_down, 'cool_down');

  const total = warmSum + mainSum + coolSum;
  if (total !== plan.estimated_distance_m) {
    throw new ValidationIssue('estimated_distance_m does not match total section distances');
  }
  if (plan.estimated_distance_m <= 0) {
    throw new ValidationIssue('estimated_distance_m must be > 0');
  }
  if (plan.estimated_distance_m % 50 !== 0) {
    throw new ValidationIssue('estimated_distance_m must be divisible by 50');
  }
  if (plan.duration_minutes <= 0) {
    throw new ValidationIssue('duration_minutes must be > 0');
  }
  if (plan.duration_minutes !== request.duration_minutes) {
    throw new ValidationIssue('duration_minutes must match requested duration_minutes');
  }

  const mergedTags = [...request.requested_tags, ...requestedTags];
  const preferVaried = inferPreferVaried(mergedTags, historicSessions);

  if (!preferVaried) {
    const signatures = new Set(plan.sections.main_set.steps.map(stepSignature));
    if (signatures.size > 1) {
      throw new ValidationIssue(
        'straightforward style requires one main_set pattern signature',
      );
    }
  }

  if (preferVaried && plan.sections.main_set.steps.length < 2) {
    throw new ValidationIssue('varied style should include at least 2 main_set steps');
  }

  if (hasSensitiveDownFeedback(historicSessions)) {
    for (const step of plan.sections.main_set.steps) {
      if (
        step.kind === 'continuous' &&
        step.effort === 'hard' &&
        stepDistanceM(step) > 500
      ) {
        throw new ValidationIssue(
          'main_set contains long hard continuous block despite sensitive thumbs-down history',
        );
      }
    }
  }
}
