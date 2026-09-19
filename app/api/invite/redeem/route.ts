import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { serviceSupabase } from '@/lib/supabase/service';

export async function POST(request: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { data: existing } = await supabase
    .from('profiles').select('id').eq('id', user.id).maybeSingle();
  if (existing) return NextResponse.json({ error: 'Ya tienes una cuenta activa' }, { status: 400 });

  const { code } = await request.json() as { code: string };

  // Atomic claim: UPDATE only rows where used_by is still null.
  // If two concurrent requests race, only one UPDATE will match — the other gets 0 rows back.
  const now = new Date().toISOString();
  const { data: claimed } = await serviceSupabase
    .from('invite_codes')
    .update({ used_by: user.id, used_at: now })
    .eq('code', code)
    .is('used_by', null)
    .gt('expires_at', now)
    .select();

  if (!claimed || claimed.length === 0)
    return NextResponse.json({ error: 'Código inválido, vencido o ya usado. Pide uno nuevo a tus papás.' }, { status: 400 });

  const invite = claimed[0];
  const displayName = user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? 'Usuario';
  const { data: profile, error } = await serviceSupabase
    .from('profiles').insert({
      id: user.id, family_id: invite.family_id, role: invite.role,
      display_name: displayName, email: user.email ?? '',
    }).select().single();
  if (error) return NextResponse.json({ error: 'Error al crear perfil' }, { status: 500 });
  return NextResponse.json({ profile });
}
