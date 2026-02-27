// Port of swim_planner_llm/llm_client.py — prompt construction only.

import type { HistoricSession, SwimPlanInput } from './types';
import { inferPreferVaried } from './style-inference';

export const SYSTEM_PROMPT =
  'You are a swim session planner. You must return valid JSON matching the provided schema. ' +
  'Do not include markdown, comments, explanations, or extra keys.';

// ── Schema example (mirrors _schema_excerpt() in Python) ─────────────────────

export function schemaExcerpt(): string {
  const example = {
    plan_id: 'uuid',
    created_at: 'ISO-8601 datetime',
    duration_minutes: 20,
    estimated_distance_m: 700,
    sections: {
      warm_up: {
        title: 'Warm-up',
        section_distance_m: 200,
        steps: [
          {
            step_id: 'wu-1',
            kind: 'continuous',
            reps: 1,
            distance_per_rep_m: 200,
            stroke: 'freestyle',
            rest_seconds: null,
            effort: 'easy',
            description: 'Easy relaxed warm-up swim.',
          },
        ],
      },
      main_set: {
        title: 'Main Set',
        section_distance_m: 400,
        steps: [
          {
            step_id: 'main-1',
            kind: 'intervals',
            reps: 8,
            distance_per_rep_m: 50,
            stroke: 'freestyle',
            rest_seconds: 20,
            effort: 'hard',
            description: 'Hold a strong, controlled pace across all repeats.',
          },
        ],
      },
      cool_down: {
        title: 'Cool-down',
        section_distance_m: 100,
        steps: [
          {
            step_id: 'cd-1',
            kind: 'continuous',
            reps: 1,
            distance_per_rep_m: 100,
            stroke: 'choice',
            rest_seconds: null,
            effort: 'easy',
            description: 'Easy cooldown.',
          },
        ],
      },
    },
  };
  return JSON.stringify(example, null, 2);
}

// ── History summarisation (mirrors summarize_history() in Python) ─────────────

function extractDistance(session: HistoricSession): number | null {
  const v = session.session_plan?.estimated_distance_m;
  return typeof v === 'number' && v > 0 ? v : null;
}

export function summarizeHistory(historicSessions: HistoricSession[]): string {
  const upDistances: number[] = [];
  const downDistances: number[] = [];
  const upTags = new Set<string>();
  const downTags = new Set<string>();
  let dislikedLongHardContinuous = false;

  for (const item of historicSessions) {
    const d = extractDistance(item);
    const tags = new Set(item.tags.map((t) => t.trim().toLowerCase()).filter(Boolean));

    if (item.thumb === 1) {
      if (d !== null) upDistances.push(d);
      tags.forEach((t) => upTags.add(t));
    } else {
      if (d !== null) downDistances.push(d);
      tags.forEach((t) => downTags.add(t));
      if (['pace-too-fast', 'long', 'tiring'].some((r) => tags.has(r))) {
        dislikedLongHardContinuous = true;
      }
    }
  }

  function range(values: number[]): string {
    if (values.length === 0) return 'none';
    return `${Math.min(...values)}-${Math.max(...values)}m`;
  }

  const guidance: string[] = [];

  if (upDistances.length > 0) {
    guidance.push(`Prefer volume near ${range(upDistances)}.`);
  } else {
    guidance.push('No positive volume signal available.');
  }

  if (downDistances.length > 0) {
    guidance.push(`Avoid volume near ${range(downDistances)} unless strongly required.`);
  }

  if (upTags.size > 0) {
    guidance.push(`Positive themes: ${JSON.stringify([...upTags].sort())}.`);
  }

  if (downTags.size > 0) {
    guidance.push(`Negative themes: ${JSON.stringify([...downTags].sort())}.`);
  }

  if (dislikedLongHardContinuous) {
    guidance.push('Avoid long hard continuous main sets; prefer intervals instead.');
  }

  return guidance.join(' ');
}

// ── Tag helpers ───────────────────────────────────────────────────────────────

function getRequestedTags(payload: SwimPlanInput): string[] {
  const combined = [
    ...payload.session_requested.requested_tags,
    ...payload.requested_tags,
  ];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const t of combined) {
    const cleaned = t.trim().toLowerCase();
    if (!cleaned || seen.has(cleaned)) continue;
    seen.add(cleaned);
    out.push(cleaned);
  }
  return out;
}

const TAG_HINT_MAP: Record<string, string> = {
  technique:
    'Include drill-oriented or form-focused language, especially in warm_up or early main_set.',
  speed:
    'Bias the main_set toward shorter interval repeats with firmer effort and controlled rest.',
  endurance:
    'Bias toward longer repeats or more continuous aerobic structure, within historically tolerated volume.',
  recovery: 'Use easy pacing, generous rest, and simple structure.',
  fun: 'Use engaging but still clear set descriptions; mild variation is acceptable if compatible with inferred style guidance.',
  steady: 'Prefer repeatable, even-paced aerobic efforts over abrupt pace changes.',
  short: 'Keep the plan efficient and avoid unnecessary extra steps.',
  hard: 'Express intensity through interval density or reduced rest, not excessive volume.',
  easy: 'Keep effort controlled and low stress.',
  freestyle: 'Prefer freestyle in the main_set where possible.',
  mixed: 'Allow mixed stroke usage where appropriate.',
};

function requestedTagHints(requestedTags: string[]): string {
  if (requestedTags.length === 0) return 'No requested tags supplied.';
  const hints = requestedTags.filter((t) => t in TAG_HINT_MAP).map((t) => TAG_HINT_MAP[t]);
  if (hints.length === 0) {
    return 'Reflect requested tags in step descriptions and structure where compatible with constraints.';
  }
  return hints.join(' ');
}

function distanceGuidance(durationMinutes: number, effort: string): string {
  const paceByEffort: Record<string, [number, number]> = {
    easy: [25, 35],
    medium: [30, 40],
    hard: [35, 45],
  };
  const [loPpm, hiPpm] = paceByEffort[effort] ?? [30, 40];
  const lo = durationMinutes * loPpm;
  const hi = durationMinutes * hiPpm;
  return (
    `Target estimated_distance_m for this request: ${lo}-${hi}m ` +
    `(derived from duration=${durationMinutes} and effort=${effort}).`
  );
}

function effortHint(effort: string): string {
  const map: Record<string, string> = {
    easy: 'Prioritize relaxed pacing, longer recoveries, and low complexity.',
    medium: 'Use steady aerobic work with moderate rest and controlled intensity.',
    hard: 'Increase interval density or reduce rest; avoid excessive volume spikes.',
  };
  return map[effort] ?? 'Use balanced effort progression across sections.';
}

function styleHint(preferVaried: boolean): string {
  if (preferVaried) {
    return (
      'Inferred preferred style is varied. Build a main set with 2-3 distinct steps ' +
      'while preserving schema consistency.'
    );
  }
  return 'Inferred preferred style is straightforward. Keep the main set to one clear pattern.';
}

// ── Prompt builders ───────────────────────────────────────────────────────────

export function buildUserPrompt(payload: SwimPlanInput, historySummary: string): string {
  const requestedTags = getRequestedTags(payload);
  const { effort, duration_minutes: duration } = payload.session_requested;
  const preferVaried = inferPreferVaried(
    [...payload.session_requested.requested_tags, ...payload.requested_tags],
    payload.historic_sessions,
  );
  const inferredStyle = preferVaried ? 'varied' : 'straightforward';

  return (
    'Generate a personalised swim session plan.\n\n' +
    'DECISION PRIORITY (follow in this order):\n' +
    '1. Return valid JSON matching the schema exactly.\n' +
    '2. Match requested duration_minutes.\n' +
    '3. Match requested effort.\n' +
    '4. Match inferred session style from requested tags + history.\n' +
    '5. Use history to prefer previously successful structure and volume.\n' +
    '6. Apply requested tags where compatible.\n\n' +
    'REQUEST:\n' +
    JSON.stringify(payload.session_requested, Object.keys(payload.session_requested).sort()) +
    '\n\n' +
    'INFERRED STYLE:\n' +
    inferredStyle +
    '\n\n' +
    'REQUESTED TAGS:\n' +
    JSON.stringify(requestedTags) +
    '\n' +
    requestedTagHints(requestedTags) +
    '\n\n' +
    'HISTORIC GUIDANCE:\n' +
    historySummary +
    '\n\n' +
    'EFFORT GUIDANCE:\n' +
    effortHint(effort) +
    '\n\n' +
    'STYLE GUIDANCE:\n' +
    styleHint(preferVaried) +
    '\n\n' +
    'DISTANCE GUIDANCE:\n' +
    distanceGuidance(duration, effort) +
    '\n\n' +
    'HARD CONSTRAINTS:\n' +
    '- Return exactly ONE JSON object.\n' +
    '- Do not include markdown.\n' +
    '- Do not include comments.\n' +
    '- Do not include explanations.\n' +
    '- Do not include extra keys.\n' +
    '- Include sections.warm_up, sections.main_set, sections.cool_down.\n' +
    '- Every section must include title, section_distance_m, and steps.\n' +
    '- Every step must include all required fields.\n' +
    '- Sum of all step distances must equal section_distance_m.\n' +
    '- Sum of all sections must equal estimated_distance_m.\n' +
    '- All distances must be divisible by 50.\n' +
    '- reps must be > 0.\n' +
    '- distance_per_rep_m must be > 0.\n' +
    '- rest_seconds must be null or >= 0.\n' +
    '- Allowed kind values: continuous, intervals.\n' +
    '- Allowed stroke values: freestyle, backstroke, breaststroke, mixed, choice.\n' +
    '- Allowed effort values: easy, medium, hard.\n\n' +
    'SESSION-SPECIFIC RULES:\n' +
    '- If inferred style is straightforward: main_set must contain one clear pattern only.\n' +
    '- If inferred style is varied: main_set should usually contain 2-3 distinct steps with clear variation.\n' +
    '- If disliked history suggests pace-too-fast, long, or tiring, avoid long hard continuous main sets over 500m.\n' +
    '- For hard effort, increase intensity using interval density or shorter rest, not excessive distance.\n' +
    '- Prefer expressing requested tag intent in the main_set first.\n\n' +
    'OUTPUT SHAPE EXAMPLE:\n' +
    schemaExcerpt() +
    '\n\n' +
    'Return the final JSON object only.'
  );
}

export function buildRepairPrompt(originalText: string, errorText: string): string {
  return (
    'Your previous response was invalid.\n\n' +
    'TASK:\n' +
    'Return a corrected version of the JSON only.\n' +
    'Do not explain the error.\n' +
    'Do not include markdown.\n' +
    'Do not include any text before or after the JSON.\n\n' +
    'VALIDATION ERROR:\n' +
    errorText +
    '\n\n' +
    'PREVIOUS OUTPUT:\n' +
    originalText +
    '\n\n' +
    'REQUIRED SHAPE:\n' +
    schemaExcerpt() +
    '\n\n' +
    'Return one corrected JSON object only.'
  );
}
