import { NextResponse } from 'next/server';
import { getUserWithRateLimitHandling } from '@/lib/supabase/auth';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET() {
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

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  const { data: plans } = await supabase
    .from('plans')
    .select('*')
    .eq('user_id', user.id)
    .in('status', ['accepted', 'completed'])
    .order('created_at', { ascending: false })
    .limit(20);

  const { data: completions } = await supabase
    .from('plan_completions')
    .select('*')
    .eq('user_id', user.id)
    .order('completed_at', { ascending: false })
    .limit(50);

  return NextResponse.json({
    profile,
    plans: plans ?? [],
    completions: completions ?? []
  });
}
