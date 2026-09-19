import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getServiceSupabase } from '@/lib/supabase/service';

// GET /api/onboard — returns { isFirstUser: boolean }
// Uses profiles count (not families) so a migration-created family doesn't block the first real user.
export async function GET() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const serviceClient = getServiceSupabase();
  const { count } = await serviceClient
    .from('profiles')
    .select('id', { count: 'exact', head: true });
  return NextResponse.json({ isFirstUser: count === 0 });
}

// POST /api/onboard — creates the first padre profile, reusing an existing family if migration left one.
export async function POST(request: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const serviceClient = getServiceSupabase();
  const { count: profileCount } = await serviceClient
    .from('profiles')
    .select('id', { count: 'exact', head: true });
  if (profileCount !== 0) return NextResponse.json({ error: 'Family already has members' }, { status: 400 });

  const { displayName } = await request.json();
  if (!displayName?.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 });

  // Reuse the family the migration created, or create a fresh one if none exists.
  let familyId: string;
  const { data: existing } = await serviceClient
    .from('families').select('id').limit(1);
  if (existing && existing.length > 0) {
    familyId = existing[0].id;
  } else {
    const { data: family, error: familyErr } = await serviceClient
      .from('families').insert({ name: 'Mi familia' }).select().single();
    if (familyErr || !family) return NextResponse.json({ error: 'Failed to create family' }, { status: 500 });
    familyId = family.id;
  }

  const { data: profileRow, error: profileErr } = await serviceClient
    .from('profiles').insert({
      id: user.id,
      family_id: familyId,
      role: 'padre',
      display_name: displayName.trim(),
      email: user.email ?? '',
    }).select().single();
  if (profileErr || !profileRow) return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 });

  return NextResponse.json({ profile: profileRow });
}
