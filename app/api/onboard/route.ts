import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Only allowed when no family exists yet
  const { count } = await supabase
    .from('families')
    .select('id', { count: 'exact', head: true });
  if (count !== 0) return NextResponse.json({ error: 'Family already exists' }, { status: 400 });

  const { displayName } = await request.json();
  if (!displayName?.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 });

  const service = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data: family, error: familyErr } = await service
    .from('families').insert({ name: 'Mi familia' }).select().single();
  if (familyErr || !family) return NextResponse.json({ error: 'Failed to create family' }, { status: 500 });

  const { data: profileRow, error: profileErr } = await service
    .from('profiles').insert({
      id: user.id,
      family_id: family.id,
      role: 'padre',
      display_name: displayName.trim(),
      email: user.email ?? '',
    }).select().single();
  if (profileErr || !profileRow) return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 });

  return NextResponse.json({ profile: profileRow });
}
