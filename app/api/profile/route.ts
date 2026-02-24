import { NextResponse } from 'next/server';
import { getUserWithRateLimitHandling } from '@/lib/supabase/auth';
import { createSupabaseServerClient } from '@/lib/supabase/server';

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

  const body = await request.json();
  const swim_level = body.swim_level as string;
  const preferences = (body.preferences ?? {}) as Record<string, any>;

  const { data, error } = await supabase
    .from('profiles')
    .upsert(
      {
        id: user.id,
        swim_level,
        preferences
      },
      { onConflict: 'id' }
    )
    .select('*')
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ profile: data });
}
