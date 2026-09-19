import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { serviceSupabase as serviceClient } from '@/lib/supabase/service';

// GET /api/onboard — returns { isFirstUser: boolean }
// Uses service-role client so RLS cannot blind the family count.
export async function GET() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { count } = await serviceClient
    .from('families')
    .select('id', { count: 'exact', head: true });
  return NextResponse.json({ isFirstUser: count === 0 });
}

// POST /api/onboard — creates family + padre profile for the first user
export async function POST(request: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Service-role count — RLS-blind, accurate
  const { count } = await serviceClient
    .from('families')
    .select('id', { count: 'exact', head: true });
  if (count !== 0) return NextResponse.json({ error: 'Family already exists' }, { status: 400 });

  const { displayName } = await request.json();
  if (!displayName?.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 });

  const { data: family, error: familyErr } = await serviceClient
    .from('families').insert({ name: 'Mi familia' }).select().single();
  if (familyErr || !family) return NextResponse.json({ error: 'Failed to create family' }, { status: 500 });

  const { data: profileRow, error: profileErr } = await serviceClient
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
