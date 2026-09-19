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

  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

  // Try up to 5 times. The DB has a global unique index on active codes, so we rely on
  // the insert itself to detect collisions (error code 23505) and retry with a new candidate.
  for (let i = 0; i < 5; i++) {
    const buf = new Uint8Array(3);
    crypto.getRandomValues(buf);
    const candidate = String(((buf[0] << 16) | (buf[1] << 8) | buf[2]) % 1_000_000).padStart(6, '0');
    const { data: invite, error } = await supabase
      .from('invite_codes')
      .insert({ family_id: profile.family_id, code: candidate, role, created_by: user.id, expires_at: expiresAt })
      .select().single();
    if (!error) return NextResponse.json({ code: invite.code, expires_at: invite.expires_at });
    if (error.code !== '23505') return NextResponse.json({ error: 'Error al crear código' }, { status: 500 });
    // 23505 = unique_violation → try a different code
  }
  return NextResponse.json({ error: 'No se pudo generar el código' }, { status: 500 });
}
