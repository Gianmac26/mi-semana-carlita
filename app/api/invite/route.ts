import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { data: profile } = await supabase
    .from('profiles').select('family_id, role').eq('id', user.id).maybeSingle();
  if (!profile || profile.role !== 'padre')
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const { role } = await request.json() as { role: 'padre' | 'hijo' };
  if (!['padre', 'hijo'].includes(role))
    return NextResponse.json({ error: 'Rol inválido' }, { status: 400 });

  let code: string | null = null;
  for (let i = 0; i < 5; i++) {
    const candidate = String(Math.floor(Math.random() * 1_000_000)).padStart(6, '0');
    const { count } = await supabase
      .from('invite_codes').select('id', { count: 'exact', head: true })
      .eq('family_id', profile.family_id).eq('code', candidate)
      .is('used_by', null).gt('expires_at', new Date().toISOString());
    if (count === 0) { code = candidate; break; }
  }
  if (!code) return NextResponse.json({ error: 'No se pudo generar el código' }, { status: 500 });

  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
  const { data: invite, error } = await supabase
    .from('invite_codes')
    .insert({ family_id: profile.family_id, code, role, created_by: user.id, expires_at: expiresAt })
    .select().single();
  if (error) return NextResponse.json({ error: 'Error al crear código' }, { status: 500 });
  return NextResponse.json({ code: invite.code, expires_at: invite.expires_at });
}
