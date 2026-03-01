import { NextResponse } from 'next/server';
import { getUserWithRateLimitHandling } from '@/lib/supabase/auth';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { GOBY_BY_LEVEL } from '@/lib/gobies';

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
  // Assign goby species based on swim level.
  // NOTE: requires `goby_species text` column on the profiles table.
  // Run: ALTER TABLE public.profiles ADD COLUMN goby_species text;
  const goby_species = GOBY_BY_LEVEL[swim_level] ?? null;

  const { data, error } = await supabase
    .from('profiles')
    .upsert(
      {
        id: user.id,
        swim_level,
        preferences,
        goby_species,
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
