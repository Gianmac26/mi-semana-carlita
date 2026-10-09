import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getServiceSupabase } from '@/lib/supabase/service';

// GET /api/onboard — returns { hasProfile: boolean }
// Checks whether THIS user has a profile, not whether any profile exists globally.
// Multi-tenant safe: demo seed data or other families don't affect this user's onboard flow.
export async function GET() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const serviceClient = getServiceSupabase();
  const { data: existing } = await serviceClient
    .from('profiles').select('id').eq('id', user.id).maybeSingle();
  return NextResponse.json({ hasProfile: !!existing });
}

// POST /api/onboard — creates a new family + padre profile for the authenticated user.
export async function POST(request: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const serviceClient = getServiceSupabase();
  const { data: existingProfile } = await serviceClient
    .from('profiles').select('id').eq('id', user.id).maybeSingle();
  if (existingProfile) return NextResponse.json({ error: 'Ya tienes un perfil activo' }, { status: 400 });

  const { displayName } = await request.json();
  if (!displayName?.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 });

  // Multi-tenant: cada padre crea su propia familia. No reutilizamos familias existentes.
  const { data: family, error: familyErr } = await serviceClient
    .from('families').insert({ name: 'Mi familia' }).select().single();
  if (familyErr || !family) return NextResponse.json({ error: 'Failed to create family' }, { status: 500 });
  const familyId = family.id;

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
