// Port of swim_planner_llm/llm_client.py — prompt construction only.
// Kept in sync with the Python source of truth.

import type { HistoricSession, SwimPlanInput } from './types';
import { inferPreferVaried } from './style-inference';

// ── System prompt ─────────────────────────────────────────────────────────────

export const SYSTEM_PROMPT =
  'You are an expert and fun swimming coach with deep knowledge of energy systems, periodization, ' +
  'and effective swim session design. You know how to make people enjoy swimming. ' +
  'People enjoy your sessions and want to do more of them. ' +
  'Your plans follow sound coaching principles: ' +
  'progressive warm-ups that prime the body for work, main sets matched to the target energy ' +
  'system, and genuine cool-downs that aid recovery and lactate clearance. ' +
  'You must return valid JSON matching the provided schema exactly. ' +
  'Do not include markdown, comments, explanations, or extra keys. ' +
  'Sessions should feel engaging and varied — use pyramids, builds, descending sets, and mixed formats where appropriate to keep the swimmer interested and motivated.';

// ── Schema example (mirrors _schema_excerpt() in Python) ─────────────────────

export function schemaExcerpt(): string {
  // TODO: validator — update validate.ts to accept new step kinds: pyramid, descending,
  // ascending, build, negative_split. Validate pyramid_sequence_m (present when required,
  // all values multiples of 50, sum == step distance contribution, reps == length).
  // Also accept optional hypoxic and split_instruction fields on steps.
  const example = {
    plan_id: 'uuid',
    created_at: 'ISO-8601 datetime',
    duration_minutes: 20,
    estimated_distance_m: 1150,
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
        section_distance_m: 850,
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
          {
            step_id: 'main-2',
            kind: 'pyramid',
            reps: 5,
            distance_per_rep_m: 50,
            pyramid_sequence_m: [50, 100, 150, 100, 50],
            stroke: 'freestyle',
            rest_seconds: 20,
            effort: 'medium',
            description: 'Build up and back down — settle into your rhythm on the way up and hold it on the way down.',
            hypoxic: false,
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

function extractMainSetKinds(session: HistoricSession): Set<string> {
  const steps: unknown[] =
    (session.session_plan as any)?.sections?.main_set?.steps ?? [];
  const kinds = new Set<string>();
  for (const s of steps) {
    if (s && typeof s === 'object' && typeof (s as any).kind === 'string') {
      kinds.add((s as any).kind);
    }
  }
  return kinds;
}

function extractMainSetStrokes(session: HistoricSession): Set<string> {
  const steps: unknown[] =
    (session.session_plan as any)?.sections?.main_set?.steps ?? [];
  const strokes = new Set<string>();
  for (const s of steps) {
    if (s && typeof s === 'object' && typeof (s as any).stroke === 'string') {
      strokes.add((s as any).stroke);
    }
  }
  return strokes;
}

export function summarizeHistory(historicSessions: HistoricSession[]): string {
  const upDistances: number[] = [];
  const downDistances: number[] = [];
  const upTags = new Set<string>();
  const downTags = new Set<string>();
  let dislikedLongHardContinuous = false;
  let likedIntervalSessions = 0;
  let likedContinuousSessions = 0;
  const likedStrokeCounts = new Map<string, number>();

  for (const item of historicSessions) {
    const d = extractDistance(item);
    const tags = new Set(item.tags.map((t) => t.trim().toLowerCase()).filter(Boolean));
    const kinds = extractMainSetKinds(item);
    const strokes = extractMainSetStrokes(item);

    if (item.thumb === 1) {
      if (d !== null) upDistances.push(d);
      tags.forEach((t) => upTags.add(t));
      if (kinds.has('intervals')) likedIntervalSessions += 1;
      else if (kinds.has('continuous')) likedContinuousSessions += 1;
      for (const stroke of strokes) {
        if (stroke !== 'mixed' && stroke !== 'choice') {
          likedStrokeCounts.set(stroke, (likedStrokeCounts.get(stroke) ?? 0) + 1);
        }
      }
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

  if (likedIntervalSessions > likedContinuousSessions) {
    guidance.push('Historic preference: interval-based main sets over continuous.');
  } else if (likedContinuousSessions > likedIntervalSessions) {
    guidance.push('Historic preference: continuous main sets over intervals.');
  }

  if (likedStrokeCounts.size > 0) {
    const topStrokes = [...likedStrokeCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([stroke]) => stroke);
    guidance.push(`Preferred strokes in liked sessions: ${JSON.stringify(topStrokes)}.`);
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
    'Build the main_set as a drill circuit with 3-5 distinct drill steps. ' +
    'Draw from the following drill repertoire — choose whichever complement the ' +
    'session effort and style: ' +
    'Kick (hold a float, flutter kick from the hips — tight kick, toes pointed, ' +
    'knees just below the surface); ' +
    'Pull (pull buoy between thighs, no kick — focus on high-elbow catch and ' +
    'full extension on entry); ' +
    'Fists (swim with clenched fists to engage the forearm and build feel for ' +
    'the catch, relax on recovery); ' +
    'Front Scull (arms extended, trace a figure-8 to feel pressure on the palm ' +
    'and develop water feel); ' +
    'Mid Scull (elbows bent at 90°, figure-8 pattern at mid-stroke to strengthen ' +
    'the catch); ' +
    'Doggy Paddle (arms stay underwater throughout, focus on body rotation and ' +
    'keeping hips high); ' +
    'Single Arm (one arm at the side, stroke with the other — develop rotation ' +
    'and balance, switch arms each length); ' +
    'Kick on Side (lie on your side, lower arm extended, kick and rotate to ' +
    'breathe — addresses crossover and improves streamlining). ' +
    'Each step description must be one brief sentence cueing the drill\'s key mechanic. ' +
    'Aim for variety across different movement patterns (kick, pull, catch, rotation).',
  speed:
    'Short, fast repeats at near-maximal effort with full recovery (30-60s rest) so quality is maintained ' +
    'across all reps. Use 50m repeats; 6-12 reps is typical. Descriptions should cue explosive starts, ' +
    'high stroke rate, and a strong finish. ' +
    'Consider using a descending sequence (e.g. 100, 50) to build into peak speed across the set.',
  endurance:
    'Longer steady repeats or sustained continuous swimming with short rest (10-20s). ' +
    'Effort stays controlled and comfortable throughout. ' +
    'Descriptions should emphasise rhythm, controlled breathing, and maintaining ' +
    'good form. ' +
    'A pyramid (e.g. 100, 150, 200, 150, 100) is an effective endurance structure — consider it for variety.',
  recovery:
    'Active recovery session. Keep everything easy and predictable. ' +
    'Prefer continuous swimming over intervals. Use generous rest between any effort ' +
    'changes (45-60s). Target the low end of the distance range. No intensity spikes.',
  fun:
    'Create a genuinely varied and playful session. The main set MUST use at least two different ' +
    'step kinds (e.g. a pyramid followed by a build, or a descending set followed by intervals). ' +
    'Mix strokes, formats, or distances across steps. Include at least one step that is structurally ' +
    'different from a standard interval set — e.g. a pyramid, a negative split, or a build. ' +
    'Descriptions should be warm, encouraging, and specific. Avoid clinical language.' +
    'Make this session feel like play, not training. Use at least one pyramid or descending set. ' +
    'Mix strokes if possible. Include one step with an unusual format — a build, a negative split, ' +
    'or a hypoxic set. Keep descriptions light and fun. Avoid anything that sounds like a race or a test.',
  steady:
    'Aerobic threshold pace. All reps at the same controlled, repeatable effort with ' +
    'consistent rest. Avoid mixed pacing. Descriptions should emphasise holding a steady tempo. ' +
    'Note: ascending sets with consistent rest are compatible with steady effort if pace is even throughout.',
  short: 'Efficient structure. Minimise transition steps. Prioritise quality over quantity.',
  hard:
    'High intensity. Use short rest (10-20s) between intervals or reduce rep distance ' +
    'so quality is maintained throughout. Descriptions should cue maximum sustainable ' +
    'effort and strong body position.',
  easy: 'Low intensity throughout. Prioritise smooth technique and controlled breathing over pace.',
  freestyle:
    'Use freestyle as the primary stroke in the main_set. Only deviate for explicit drill steps.',
  mixed: 'Rotate strokes across steps. Include at least two different strokes in the main_set.',
  butterfly:
    'Include butterfly in at least one main_set step. Use short distances (25-50m per ' +
    'rep) given its technical demands and energy cost. Describe body undulation and ' +
    'timing cues.',
  kick:
    'Include a dedicated kick step in the main_set (no arm pull; kickboard or streamline). ' +
    'Place it as the first main_set step, followed by the primary work. ' +
    'Descriptions should cue tight flutter kick from the hips, limited knee bend, and relaxed ankles.',
  pull:
    'Include a pull-focused step (pull buoy, no kick) in the main_set to emphasise ' +
    'catch and upper-body engagement. Good for isolating the pull phase and building ' +
    'feel for the water.',
  threshold:
    'Firm, comfortably hard effort the swimmer can just sustain. Use 200-400m repeats ' +
    'with short rest (15-30s). Descriptions should cue holding an even pace and ' +
    'staying relaxed under pressure.',
  sprints:
    'Maximum effort short repeats (50m). Full recovery between each (45-90s). ' +
    'Focus on explosive power and peak speed. 6-10 reps is typical. Describe ' +
    'drive off the wall and maintaining stroke rate to the flags.',
  hypoxic:
    'Include 1-2 hypoxic steps in the main set. Mark these with hypoxic: true. ' +
    'Reduce breathing frequency (every 5, 7, or 9 strokes) or hold breath for a full length. ' +
    'Use short distances (50m per rep) and generous rest (30-45s). ' +
    'Descriptions must clearly state the breathing pattern. Never use hypoxic on warm-up or cool-down steps.',
};

function requestedTagHints(requestedTags: string[]): string {
  if (requestedTags.length === 0) return 'No requested tags supplied.';
  const hints = requestedTags.filter((t) => t in TAG_HINT_MAP).map((t) => TAG_HINT_MAP[t]);
  if (hints.length === 0) {
    return 'Reflect requested tags in step descriptions and structure where compatible with constraints.';
  }
  return hints.join(' ');
}

// ── Effort guidance ───────────────────────────────────────────────────────────

function effortHint(effort: string): string {
  const map: Record<string, string> = {
    easy:
      'Aerobic recovery pace — all steps should feel comfortable throughout. ' +
      'Warm-up: 1-2 easy continuous swims (100-200m each). ' +
      'Main set: longer repeats (100-200m each) or continuous swimming with 15-30s rest. ' +
      'Cool-down: very easy choice of stroke. No intensity spikes anywhere.',
    medium:
      'Steady work at a comfortably challenging pace the swimmer can sustain. ' +
      'Warm-up: easy continuous build, optionally ending with 4×50m progressive activation. ' +
      'Main set: 100-200m repeats with 15-30s rest, or longer sustained efforts. ' +
      'Cool-down: easy relaxed swimming.',
    hard:
      'High-intensity training. ' +
      'Warm-up is critical: include an easy build and a brief activation piece ' +
      '(e.g. 4-6×50m at medium effort) before the main set. ' +
      'Main set: short-to-medium repeats (50-100m each) with adequate rest (20-45s) to ' +
      'preserve quality across all reps — quality over volume. ' +
      'Total session volume should be lower than an equivalent easy or medium session. ' +
      'Cool-down: minimum 100m of easy continuous swimming.',
  };
  return map[effort] ?? 'Use balanced effort progression across sections.';
}

// ── Distance guidance ─────────────────────────────────────────────────────────

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

// ── Section proportion guidance ───────────────────────────────────────────────

function sectionProportionGuidance(effort: string, durationMinutes: number): string {
  const paceByEffort: Record<string, [number, number]> = {
    easy: [25, 35],
    medium: [30, 40],
    hard: [35, 45],
  };
  const [loPpm, hiPpm] = paceByEffort[effort] ?? [30, 40];
  const target = Math.round((durationMinutes * (loPpm + hiPpm)) / 2 / 50) * 50;

  const warmFrac = effort === 'easy' ? 0.22 : effort === 'medium' ? 0.20 : 0.22;
  const coolFrac = effort === 'easy' ? 0.16 : effort === 'medium' ? 0.13 : 0.10;

  const warm = Math.max(Math.round((target * warmFrac) / 50) * 50, 50);
  const cool = Math.max(Math.round((target * coolFrac) / 50) * 50, 50);
  let main = target - warm - cool;
  if (main < 50) main = 50;

  return (
    `Suggested section distances for this session (all must be exact multiples of 50m): ` +
    `warm_up ~${warm}m, main_set ~${main}m, cool_down ~${cool}m ` +
    `(total ~${warm + main + cool}m).`
  );
}

// ── Style hint ────────────────────────────────────────────────────────────────

function styleHint(preferVaried: boolean): string {
  if (preferVaried) {
    return (
      'Inferred preferred style is varied. Build a main set with 2-3 distinct steps using different formats — ' +
      'consider pyramids, descending sets, builds, or negative splits alongside standard intervals. ' +
      'Preserve schema consistency.'
    );
  }
  return 'Inferred preferred style is straightforward. Keep the main set to one clear pattern.';
}

// ── Session type override (technique tag) ─────────────────────────────────────

function sessionTypeOverride(requestedTags: string[], effort: string): string {
  if (!requestedTags.includes('technique')) return '';

  const effortExpression: Record<string, string> = {
    easy:
      'Use generous rest between drill reps (30-45s) and low rep counts. ' +
      'Focus entirely on quality of movement, not speed.',
    medium:
      'Use moderate rest between drill reps (20-30s). ' +
      'Aim for controlled, consistent mechanics across all reps.',
    hard:
      'Use shorter rest between drill reps (10-20s) and higher rep counts ' +
      'to build technique under fatigue. Still prioritise clean mechanics over pace.',
  };

  const expression = effortExpression[effort] ?? 'Adjust rest to match the requested effort level.';

  return (
    'SESSION TYPE: TECHNIQUE / DRILL CIRCUIT\n' +
    'This overrides the default effort-based main_set structure.\n' +
    'The main_set MUST contain 3-5 steps, each using a DIFFERENT named drill type.\n' +
    'Valid drill types: Kick, Pull, Fists, Front Scull, Mid Scull, ' +
    'Doggy Paddle, Single Arm, Kick on Side.\n' +
    'Do NOT use plain freestyle interval repeats in the main_set.\n' +
    'Do NOT repeat the same drill type in more than one step.\n' +
    `The effort value '${effort}' is expressed as: ${expression}\n` +
    'Each step description must be one concise sentence: name the drill and give the single most important coaching cue.'
  );
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

  const sessionOverride = sessionTypeOverride(requestedTags, effort);

  const overrideBlock = sessionOverride
    ? `SESSION OVERRIDE (takes precedence over EFFORT GUIDANCE for main_set structure):\n${sessionOverride}\n\n`
    : '';

  const effortBlock = sessionOverride
    ? `EFFORT GUIDANCE:\nmain_set structure is defined by the SESSION OVERRIDE — apply effort '${effort}' ` +
      `as described there.\nFor warm_up and cool_down sections: ${effortHint(effort)}\n\n`
    : `EFFORT GUIDANCE:\n${effortHint(effort)}\n\n`;

  return (
    'Generate a personalised swim session plan.\n\n' +
    'DECISION PRIORITY (follow in this order):\n' +
    '1. Return valid JSON matching the schema exactly.\n' +
    '2. Match requested duration_minutes.\n' +
    '3. If a SESSION OVERRIDE is present, honour it for main_set structure before applying effort guidance.\n' +
    '4. Match requested effort (expressed through rest duration and rep density, not set type).\n' +
    '5. Match inferred session style from requested tags + history.\n' +
    '6. Use history to prefer previously successful structure and volume.\n' +
    '7. Apply remaining requested tags where compatible.\n\n' +
    'REQUEST:\n' +
    JSON.stringify(payload.session_requested, Object.keys(payload.session_requested).sort() as any) +
    '\n\n' +
    overrideBlock +
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
    effortBlock +
    'STYLE GUIDANCE:\n' +
    styleHint(preferVaried) +
    '\n\n' +
    'DISTANCE GUIDANCE:\n' +
    distanceGuidance(duration, effort) +
    '\n\n' +
    'SECTION PROPORTIONS:\n' +
    sectionProportionGuidance(effort, duration) +
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
    '- All distances must be exact multiples of 50 (50, 100, 150, 200, ...): ' +
    'distance_per_rep_m, section_distance_m, and estimated_distance_m.\n' +
    '- Minimum distance_per_rep_m is 50m. Never use 25m or any non-multiple of 50.\n' +
    '- Never use fractional distances. All distance values must be whole integers.\n' +
    '- reps must be > 0.\n' +
    '- A step with reps: 1 must use kind: \'continuous\', never kind: \'intervals\'.\n' +
    '- warm_up and cool_down must each contain at most 2 steps.\n' +
    '- distance_per_rep_m must be >= 50.\n' +
    '- rest_seconds must be null or >= 0.\n' +
    '- Allowed kind values: continuous, intervals, pyramid, descending, ascending, build, negative_split.\n' +
    '- When kind is pyramid, descending, or ascending: pyramid_sequence_m must be present as an array of distances.\n' +
    '- Every value in pyramid_sequence_m must be a multiple of 50 and >= 50.\n' +
    '- reps must equal pyramid_sequence_m.length for pyramid/descending/ascending steps.\n' +
    '- The sum of pyramid_sequence_m equals the step\'s distance contribution to section_distance_m.\n' +
    '- Set distance_per_rep_m to 50 as a placeholder for pyramid/descending/ascending steps.\n' +
    '- When kind is build: single rep that increases effort within the rep; use reps: 1.\n' +
    '- When kind is negative_split: include a split_instruction string field on the step.\n' +
    '- hypoxic: true is only permitted on main_set steps.\n' +
    '- hypoxic: true steps must have rest_seconds >= 20.\n' +
    '- Allowed stroke values: freestyle, backstroke, breaststroke, butterfly, mixed, choice.\n' +
    '- Allowed effort values: easy, medium, hard.\n' +
    '- All warm_up steps must use effort: easy.\n' +
    '- All cool_down steps must use effort: easy.\n\n' +
    'SESSION-SPECIFIC RULES:\n' +
    '- If a SESSION OVERRIDE is present: its rules for main_set structure are mandatory and override style rules below.\n' +
    '- If no SESSION OVERRIDE: straightforward style → main_set must contain one clear pattern only.\n' +
    '- If no SESSION OVERRIDE: varied style → main_set should contain 2-3 distinct steps with clear variation.\n' +
    '- Step descriptions must be concise: one brief sentence with the single most important coaching cue. Do not write multiple sentences.\n' +
    '- Step descriptions must use plain, everyday language. Never use technical terms — do not use words like \'phosphocreatine\', \'lactate\', \'aerobic\', \'anaerobic\', \'threshold\', \'ATP\', \'fast-twitch\', or \'energy systems\' in descriptions.\n' +
    '- Step descriptions must not use informal or cutesy words for pace or energy — do not use words like \'peppier\', \'zippy\', \'snappy\', \'punchy\', or similar. Use direct coaching language: faster, stronger, building, controlled.\n' +
    '- Step descriptions must NOT mention specific distances or metres. Cue effort, technique, or sensation — never say "start at 100m" or "drop to 50m" in a description.\n' +
    '- Step descriptions must NOT use "longer" or "shorter" to describe pace or effort — distance per rep is always fixed. Use "faster" or "slower" instead. "Long" and "short" are only permitted as stroke-length technique cues (e.g. "long, smooth strokes").\n' +
    '- Step descriptions must match the step\'s kind. Do not write a descending or pyramid description for an intervals or continuous step, and vice versa.\n' +
    '- Do not use physical analogies that do not apply to swimming (e.g. gravity, wind). Keep descriptions grounded in the swimmer\'s body and the water.\n' +
    '- If disliked history suggests pace-too-fast, long, or tiring, avoid long hard continuous main sets over 500m.\n' +
    '- For hard effort without a SESSION OVERRIDE, increase intensity using interval density or shorter rest, not excessive distance.\n' +
    '- For hard sessions, warm_up must include a short activation piece before the main set.\n' +
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
