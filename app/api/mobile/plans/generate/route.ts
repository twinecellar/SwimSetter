import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isAuthRateLimitError } from '@/lib/supabase/auth';
import type { Effort, GeneratedPlan, PlanRequest, PlanSegment } from '@/lib/plan-types';
import {
  findInvalidRequestedTags,
  isDurationMinutes,
  normalizeRequestedTags,
  REQUESTED_TAG_ALLOWLIST,
} from '@/lib/request-options';
import { runSwimPlannerLLM, type SwimPlannerPayload } from '@/lib/swim_planner_llm';

export const runtime = 'nodejs';

const MOBILE_LIMIT_MAX_REQUESTS = 20;
const MOBILE_LIMIT_WINDOW_MS = 60_000;

type LimitEntry = { count: number; resetAt: number };
const mobileLimitStore = new Map<string, LimitEntry>();

function extractBearerToken(request: Request): string | null {
  const auth = request.headers.get('authorization') ?? request.headers.get('Authorization');
  if (!auth) return null;
  const [scheme, token] = auth.split(' ');
  if (!scheme || !token || scheme.toLowerCase() !== 'bearer') return null;
  return token.trim();
}

function isRateLimited(subject: string): boolean {
  const now = Date.now();
  const current = mobileLimitStore.get(subject);

  if (!current || now >= current.resetAt) {
    mobileLimitStore.set(subject, { count: 1, resetAt: now + MOBILE_LIMIT_WINDOW_MS });
    return false;
  }

  if (current.count >= MOBILE_LIMIT_MAX_REQUESTS) return true;

  current.count += 1;
  mobileLimitStore.set(subject, current);
  return false;
}

function getLLMFailureResponse(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? '');
  const lower = message.toLowerCase();

  if (lower.includes('anthropic_api_key is missing')) {
    return {
      error: 'Planner configuration error: ANTHROPIC_API_KEY is missing.',
      code: 'LLM_MISSING_API_KEY',
    };
  }

  if (lower.includes('connection error') || lower.includes('econnrefused')) {
    return {
      error: 'Planner could not reach Anthropic. Check network and API availability.',
      code: 'LLM_CONNECTION_ERROR',
    };
  }

  if (lower.includes('json parse failed') || lower.includes('schema validation failed')) {
    return {
      error: 'Planner returned an invalid plan payload.',
      code: 'LLM_INVALID_OUTPUT',
    };
  }

  return {
    error: 'Failed to generate plan.',
    code: 'LLM_GENERATION_FAILED',
  };
}

export async function POST(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json(
      { error: 'Supabase is not configured on server' },
      { status: 500 }
    );
  }

  const accessToken = extractBearerToken(request);
  if (!accessToken) {
    return NextResponse.json(
      { error: 'Missing bearer token' },
      { status: 401 }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: 'Bearer ' + accessToken,
      },
    },
  });

  const { data: authData, error: authError } = await supabase.auth.getUser(accessToken);

  if (authError) {
    const status = isAuthRateLimitError(authError) ? 429 : 401;
    return NextResponse.json(
      { error: status === 429 ? 'Too many auth requests' : 'Unauthorized' },
      { status }
    );
  }

  const user = authData.user;
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (isRateLimited(user.id)) {
    return NextResponse.json(
      { error: 'Too many generate requests', code: 'RATE_LIMITED' },
      { status: 429 }
    );
  }

  const rawBody = await request.json();
  if (!rawBody || typeof rawBody !== 'object' || Array.isArray(rawBody)) {
    return NextResponse.json({ error: 'request body must be a JSON object' }, { status: 400 });
  }

  const body = rawBody as {
    duration_minutes?: number;
    effort?: Effort;
    requested_tags?: unknown;
  };

  if (Object.prototype.hasOwnProperty.call(body, 'fun_mode')) {
    return NextResponse.json(
      { error: 'fun_mode is no longer supported' },
      { status: 400 }
    );
  }

  const rawDuration = body.duration_minutes;
  if (!isDurationMinutes(rawDuration ?? NaN)) {
    return NextResponse.json(
      { error: 'duration_minutes must be one of 15,20,25,30,35,40,45,50,55,60' },
      { status: 400 }
    );
  }

  const rawEffort = body.effort;
  if (!['easy', 'medium', 'hard'].includes(rawEffort ?? '')) {
    return NextResponse.json(
      { error: "effort must be one of 'easy', 'medium', or 'hard'" },
      { status: 400 }
    );
  }

  const invalidTags = findInvalidRequestedTags(body.requested_tags);
  if (invalidTags.length > 0) {
    return NextResponse.json(
      {
        error:
          `requested_tags must only include: ${REQUESTED_TAG_ALLOWLIST.join(', ')}`
      },
      { status: 400 }
    );
  }

  const requestedTags = normalizeRequestedTags(body.requested_tags);
  const effort = rawEffort as Effort;
  const durationMinutes = rawDuration as PlanRequest['duration_minutes'];

  const [{ data: profileRow }, { data: completions }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
    supabase
      .from('plan_completions')
      .select('*')
      .eq('user_id', user.id)
      .in('rating', [0, 1])
      .order('completed_at', { ascending: false })
      .limit(30),
  ]);

  if (!profileRow) {
    return NextResponse.json(
      { error: 'Profile required', code: 'NO_PROFILE' },
      { status: 400 }
    );
  }

  const requestInput: PlanRequest = {
    duration_minutes: durationMinutes,
    effort,
    requested_tags: requestedTags
  };

  const completionPlanIds = (completions ?? [])
    .map((c) => c.plan_id as string)
    .filter((id): id is string => typeof id === 'string' && id.length > 0);

  const { data: completionPlans } = completionPlanIds.length
    ? await supabase
        .from('plans')
        .select('id, plan')
        .eq('user_id', user.id)
        .in('id', completionPlanIds)
    : { data: [] as any[] };

  const planById = new Map<string, any>(
    (completionPlans ?? [])
      .filter((p) => p && typeof p.id === 'string')
      .map((p) => [p.id as string, p.plan]),
  );

  type HistoricSessionPayload = {
    session_plan: {
      duration_minutes: number;
      estimated_distance_m: number;
      sections?: {
        main_set?: {
          title?: string;
        };
      };
    };
    thumb: 0 | 1;
    tags: string[];
  };

  const payload: SwimPlannerPayload = {
    session_requested: {
      duration_minutes: requestInput.duration_minutes,
      effort: requestInput.effort,
      requested_tags: requestInput.requested_tags ?? [],
      swim_level: profileRow.swim_level ?? undefined,
    },
    historic_sessions: ((completions ?? [])
      .map((completion): HistoricSessionPayload | null => {
        const planId = completion.plan_id as string;
        const linkedPlan = planById.get(planId);
        const duration = linkedPlan?.duration_minutes;
        const distance = linkedPlan?.estimated_distance_m;
        const archetypeName = linkedPlan?.metadata?.archetype_name;
        const rating = completion.rating as 0 | 1;
        const tags = (completion.tags as string[]) ?? [];

        if (typeof duration !== 'number' || typeof distance !== 'number') return null;
        if (rating !== 0 && rating !== 1) return null;
        const inferredMainTitle =
          typeof archetypeName === 'string' && archetypeName.trim().length > 0
            ? `Main Set — ${archetypeName.trim()}`
            : undefined;

        return {
          session_plan: {
            duration_minutes: duration,
            estimated_distance_m: distance,
            ...(inferredMainTitle
              ? { sections: { main_set: { title: inferredMainTitle } } }
              : {}),
          },
          thumb: rating,
          tags,
        };
      })
      .filter((v): v is HistoricSessionPayload => v !== null)),
    requested_tags: [],
  };

  const PYRAMID_KINDS = new Set(['pyramid', 'descending', 'ascending']);

  function segmentDistanceM(step: { kind?: string; reps: number; distance_per_rep_m: number; pyramid_sequence_m?: number[] | null }) {
    if (step.kind && PYRAMID_KINDS.has(step.kind) && step.pyramid_sequence_m?.length) {
      return step.pyramid_sequence_m.reduce((sum, d) => sum + d, 0);
    }
    return step.reps * step.distance_per_rep_m;
  }

	  function formatStepSummary(step: {
	    kind: string;
	    reps: number;
	    distance_per_rep_m: number;
    pyramid_sequence_m?: number[] | null;
    stroke: string;
    effort: string;
    rest_seconds: number | null;
    sendoff_seconds?: number | null;
    rest_sequence_s?: number[] | null;
    sendoff_sequence_s?: number[] | null;
    fins?: boolean | null;
    underwater?: boolean | null;
    pull?: boolean | null;
	    paddles?: boolean | null;
	    broken_pause_s?: number | null;
	    target_time_s?: number | null;
	    split_instruction?: string | null;
	    description: string;
	  }): string {
	    let base: string;
	    if (step.kind === 'continuous') {
	      base = `${segmentDistanceM(step)}m ${step.stroke} ${step.effort}`;
	    } else if (PYRAMID_KINDS.has(step.kind) && step.pyramid_sequence_m?.length) {
	      const seq = step.pyramid_sequence_m.join('-');
	      base = `${step.kind} [${seq}]m ${step.stroke} ${step.effort}`;
	    } else if (step.kind === 'build') {
	      base = `${step.distance_per_rep_m}m build ${step.stroke} ${step.effort}`;
	    } else if (step.kind === 'broken') {
	      const pause = step.broken_pause_s != null ? `${step.broken_pause_s}s pause` : 'pause';
	      base =
	        step.reps === 1
	          ? `${step.distance_per_rep_m}m broken (${pause}) ${step.stroke} ${step.effort}`
	          : `${step.reps} x ${step.distance_per_rep_m}m broken (${pause}) ${step.stroke} ${step.effort}`;
	    } else if (step.kind === 'fartlek') {
	      base = `${step.distance_per_rep_m}m fartlek ${step.stroke} ${step.effort}`;
	    } else if (step.kind === 'time_trial') {
	      const target =
	        step.target_time_s != null
	          ? ` (target ${Math.floor(step.target_time_s / 60)}:${String(step.target_time_s % 60).padStart(2, '0')})`
	          : '';
	      base = `${step.distance_per_rep_m}m time trial ${step.stroke}${target}`;
	    } else if (step.kind === 'negative_split') {
	      base = `${step.distance_per_rep_m}m negative split ${step.stroke} ${step.effort}`;
	    } else {
	      base =
	        step.reps === 1
	          ? `${step.distance_per_rep_m}m ${step.stroke} ${step.effort}`
	          : `${step.reps} x ${step.distance_per_rep_m}m ${step.stroke} ${step.effort}`;
	    }

	    let timing = '';
	    if (step.reps > 1) {
	      if (step.sendoff_sequence_s?.length) {
	        const parts = step.sendoff_sequence_s.map((v) => {
	          const m = Math.floor(v / 60);
	          const s = v % 60;
	          return `${m}:${String(s).padStart(2, '0')}`;
	        });
	        timing = ` @ [${parts.join('-')}]`;
	      } else if (step.rest_sequence_s?.length) {
	        timing = ` @ [${step.rest_sequence_s.join('-')}]s rest`;
	      } else if (step.sendoff_seconds != null) {
	        const m = Math.floor(step.sendoff_seconds / 60);
	        const s = step.sendoff_seconds % 60;
	        timing = ` @ ${m}:${String(s).padStart(2, '0')}`;
	      } else if (step.rest_seconds != null) {
	        timing = ` @ ${step.rest_seconds}s rest`;
	      }
	    }

	    const badges: string[] = [];
	    if (step.pull) badges.push('pull');
	    if (step.paddles) badges.push('paddles');
	    if (step.fins) badges.push('fins');
	    if (step.underwater) badges.push('underwater');
	    const badgeStr = badges.length ? ` [${badges.join(', ')}]` : '';
	    const desc = (step.description ?? '').trim();
	    const split = (step.split_instruction ?? '').trim();
	    const extra = split ? ` - ${split}` : '';
	    return desc ? `${base}${timing}${badgeStr} - ${desc}${extra}` : `${base}${timing}${badgeStr}${extra}`;
	  }

  try {
    const { plan: llmPlan, spec } = await runSwimPlannerLLM(payload);

    const segments: PlanSegment[] = [];
    const sections = [llmPlan.sections.warm_up, llmPlan.sections.main_set, llmPlan.sections.cool_down];

	    for (const section of sections) {
	      for (const step of section.steps) {
	        segments.push({
	          id: step.step_id,
	          type: section.title,
	          distance_m: segmentDistanceM(step),
	          stroke: step.stroke,
	          description: formatStepSummary(step),
	          effort: step.effort,
	          repeats: step.reps,
	          rest_seconds: step.reps > 1 ? (step.rest_seconds ?? undefined) : undefined,
	          sendoff_seconds: step.reps > 1 ? (step.sendoff_seconds ?? undefined) : undefined,
	        });
	      }
	    }

    const totalDistanceM = segments.reduce((sum, segment) => sum + segment.distance_m, 0);

    const plan: GeneratedPlan = {
      duration_minutes: llmPlan.duration_minutes,
      estimated_distance_m: totalDistanceM,
      segments,
      metadata: {
        version: 'llm_v2',
        swim_level: profileRow.swim_level,
        input_effort: requestInput.effort,
        archetype_id: spec.archetype.archetype_id,
        archetype_name: spec.archetype.display_name,
        forced_by_tags: spec.forced_by_tags,
      },
    };

    return NextResponse.json({ plan, request: requestInput });
  } catch (err) {
    console.error('LLM generation failed', err);
    const failure = getLLMFailureResponse(err);
    return NextResponse.json(
      failure,
      { status: 500 },
    );
  }
}
