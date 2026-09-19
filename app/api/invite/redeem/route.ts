import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@/lib/supabase/server';

const serviceSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(request: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { data: existing } = await supabase
    .from('profiles').select('id').eq('id', user.id).maybeSingle();
  if (existing) return NextResponse.json({ error: 'Ya tienes una cuenta activa' }, { status: 400 });

  const { code } = await request.json() as { code: string };

  const { data: invite } = await serviceSupabase
    .from('invite_codes').select('*').eq('code', code)
    .is('used_by', null).gt('expires_at', new Date().toISOString()).maybeSingle();
  if (!invite)
    return NextResponse.json({ error: 'Código inválido, vencido o ya usado. Pide uno nuevo a tus papás.' }, { status: 400 });

  await serviceSupabase
    .from('invite_codes').update({ used_by: user.id, used_at: new Date().toISOString() }).eq('id', invite.id);

  const displayName = user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? 'Usuario';
  const { data: profile, error } = await serviceSupabase
    .from('profiles').insert({
      id: user.id, family_id: invite.family_id, role: invite.role,
      display_name: displayName, email: user.email ?? '',
    }).select().single();
  if (error) return NextResponse.json({ error: 'Error al crear perfil' }, { status: 500 });
  return NextResponse.json({ profile });
}
