import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getUserWithRateLimitHandling } from '@/lib/supabase/auth';
import {
  generatePlan,
  type GeneratorHistory,
  type PlanRequest,
  type Profile
} from '@/lib/generator';

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

  const body = (await request.json()) as {
    duration_minutes: 20 | 30;
    effort: 'easy' | 'medium' | 'hard';
    fun_mode: 'straightforward' | 'fun';
  };

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
        acc[c.plan_id as string] = {
          plan_id: c.plan_id as string,
          rating: c.rating as number | null,
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
    duration_minutes: body.duration_minutes,
    effort: body.effort,
    fun_mode: body.fun_mode
  };

  const plan = generatePlan(profile, requestInput, history);

  return NextResponse.json({ plan, request: requestInput });
}
