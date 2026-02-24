import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser();

  if (authError || !user) {
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

