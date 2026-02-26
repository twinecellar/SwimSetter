import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getUserWithRateLimitHandling } from '@/lib/supabase/auth';
import {
  generatePlan,
  type GeneratorHistory,
  type PlanRequest,
  type Profile
} from '@/lib/generator';
import type { Effort } from '@/lib/plan-types';
import {
  findInvalidRequestedTags,
  isDurationMinutes,
  normalizeRequestedTags,
} from '@/lib/request-options';

export async function POST(request: Request) {
  const supabase = createSupabaseServerClient();
  const { user, rateLimited } = await getUserWithRateLimitHandling(supabase);

  if (rateLimited) {
    return NextResponse.json(
      { error: 'Too many auth requests', code: 'OVER_REQUEST_RATE_LIMIT' },
      { status: 429 }
    );
  }

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
          'requested_tags must only include: technique, speed, endurance, recovery, fun, steady, freestyle, mixed'
      },
      { status: 400 }
    );
  }

  const requestedTags = normalizeRequestedTags(body.requested_tags);
  const effort = rawEffort as Effort;
  const durationMinutes = rawDuration as PlanRequest['duration_minutes'];

  const { data: profileRow } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (!profileRow) {
    return NextResponse.json(
      { error: 'Profile required', code: 'NO_PROFILE' },
      { status: 400 }
    );
  }

  const { data: plans } = await supabase
    .from('plans')
    .select('*')
    .eq('user_id', user.id)
    .in('status', ['accepted', 'completed'])
    .order('created_at', { ascending: false })
    .limit(10);

  const { data: completions } = await supabase
    .from('plan_completions')
    .select('*')
    .eq('user_id', user.id)
    .order('completed_at', { ascending: false })
    .limit(50);

  const history: GeneratorHistory = {
    acceptedPlans:
      plans?.map((p) => ({
        id: p.id as string,
        created_at: p.created_at as string,
        plan: p.plan as any
      })) ?? [],
    feedbackByPlanId: (completions ?? []).reduce(
      (acc, c) => {
        const rawRating = c.rating as number | null;
        const rating =
          rawRating === 0
            ? 0
            : rawRating === 1
              ? 1
              : rawRating && rawRating > 0
                ? 1
                : null;

        acc[c.plan_id as string] = {
          plan_id: c.plan_id as string,
          rating,
          tags: (c.tags as string[]) ?? []
        };
        return acc;
      },
      {} as GeneratorHistory['feedbackByPlanId']
    )
  };

  const profile: Profile = {
    id: profileRow.id as string,
    swim_level: profileRow.swim_level,
    preferences: profileRow.preferences ?? {}
  };

  const requestInput: PlanRequest = {
    duration_minutes: durationMinutes,
    effort,
    requested_tags: requestedTags
  };

  const plan = generatePlan(profile, requestInput, history);

  return NextResponse.json({ plan, request: requestInput });
}
