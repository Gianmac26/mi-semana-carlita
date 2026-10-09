// scripts/seed-demo-users.ts
// Paso 1 de 2 del seed demo.
// Crea: 4 auth.users, 1 familia, 3 profiles, 1 global_admin, credentials.txt
//
// Uso: npx tsx scripts/seed-demo-users.ts
// Prerrequisito: .env.local con NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY

import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

// Carga .env.local sin dotenv (Next.js no lo carga en scripts externos)
// NOTA: el parser maneja KEY=value y KEY='value' pero NO comillas con contenido interno
// como KEY='value with 'quotes''. Para el demo esto es suficiente.
try {
  for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.+)$/);
    if (m) (process.env[m[1]] as string | undefined) ??= m[2].replace(/^['"]|['"]$/g, '');
  }
} catch { /* .env.local no encontrado — se usan las vars ya seteadas */ }

const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPA_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPA_URL || !SUPA_KEY) {
  console.error('Faltan vars en .env.local: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supa = createClient(SUPA_URL, SUPA_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Check temprano: verifica que el schema esté aplicado antes de continuar
const { error: schemaCheck } = await supa.from('families').select('id').limit(0);
if (schemaCheck) {
  if (schemaCheck.message?.includes('does not exist') || schemaCheck.message?.includes('relation')) {
    console.error('El schema no está aplicado. Corre reset.sql + 001_schema.sql en Supabase SQL Editor primero.');
  } else {
    console.error(`Error de conexión al verificar schema: ${schemaCheck.message}`);
  }
  process.exit(1);
}

// ── Usuarios demo ─────────────────────────────────────────────────────────────

const BASE_EMAIL = 'gian.marcal26@gmail.com';
const alias = (tag: string) => BASE_EMAIL.replace('@', `+${tag}@`);

type Role = 'padre' | 'hijo' | 'admin_global';

const USERS: { tag: string; email: string; password: string; name: string; role: Role; birth_year?: number }[] = [
  { tag: 'padre.demo', email: alias('padre.demo'), password: 'PadreDemo#2026!', name: 'Papá Demo',       role: 'padre'        },
  { tag: 'hijo1.demo', email: alias('hijo1.demo'), password: 'Hijo1Demo#2026!', name: 'Sofía (15 años)', role: 'hijo',         birth_year: 2011 },
  { tag: 'hijo2.demo', email: alias('hijo2.demo'), password: 'Hijo2Demo#2026!', name: 'Lucas (12 años)', role: 'hijo',         birth_year: 2014 },
  { tag: 'admin.demo', email: alias('admin.demo'), password: 'AdminDemo#2026!', name: 'Admin GlobalTec', role: 'admin_global' },
];

// ── Helper: crea o reutiliza un usuario en auth.users ────────────────────────

async function ensureAuthUser(email: string, password: string): Promise<string> {
  // NOTA: listUsers tiene tope de 1000 usuarios por página. Para un proyecto con más
  // usuarios habría que paginar. Para el demo con <10 users esto es suficiente.
  const { data } = await supa.auth.admin.listUsers({ perPage: 1000 });
  const found = data?.users?.find(u => u.email === email);
  if (found) { console.log(`  • ya existe:  ${email} (${found.id})`); return found.id; }
  const { data: created, error } = await supa.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error || !created.user) throw new Error(`createUser ${email}: ${error?.message}`);
  console.log(`  • creado:     ${email} (${created.user.id})`);
  return created.user.id;
}

// ── 1. auth.users ─────────────────────────────────────────────────────────────

console.log('\n── 1. auth.users');
const ids: Record<string, string> = {};
for (const u of USERS) {
  ids[u.tag] = await ensureAuthUser(u.email, u.password);
}

// ── 2. familia ────────────────────────────────────────────────────────────────

console.log('\n── 2. familia');
let familyId: string;
const { data: fams } = await supa.from('families').select('id').eq('name', 'Familia Demo GlobalTec');
if (fams && fams.length > 0) {
  familyId = fams[0].id;
  console.log(`  • ya existe:  ${familyId}`);
} else {
  const { data: f, error } = await supa
    .from('families').insert({ name: 'Familia Demo GlobalTec' }).select().single();
  if (error || !f) throw new Error(`Insert familia: ${error?.message}`);
  familyId = f.id;
  console.log(`  • creada:     ${familyId}`);
}

// ── 3. profiles (padre + hijos) ───────────────────────────────────────────────

console.log('\n── 3. profiles');
for (const u of USERS.filter(u => u.role !== 'admin_global')) {
  const row: Record<string, unknown> = {
    id:           ids[u.tag],
    family_id:    familyId,
    role:         u.role,
    display_name: u.name,
    email:        u.email,
  };
  if (u.birth_year !== undefined) row.birth_year = u.birth_year;
  const { error } = await supa.from('profiles').upsert(row, { onConflict: 'id' });
  if (error) throw new Error(`Upsert profile ${u.tag}: ${error.message}`);
  console.log(`  • ${u.name} (${u.role})`);
}

// ── 4. global_admin ───────────────────────────────────────────────────────────

console.log('\n── 4. global_admin');
const adminUser = USERS.find(u => u.tag === 'admin.demo')!;
const { error: adminErr } = await supa.from('global_admins').upsert(
  { id: ids['admin.demo'], display_name: adminUser.name, email: adminUser.email },
  { onConflict: 'id' }
);
if (adminErr) throw new Error(`Upsert global_admin: ${adminErr.message}`);
console.log(`  • ${adminUser.name}`);

// ── 5. credentials.txt ────────────────────────────────────────────────────────

console.log('\n── 5. credentials.txt');
const lines = [
  '# seed-demo.credentials.txt — SECRETO, NO commitear',
  `# Familia: Familia Demo GlobalTec  (id: ${familyId})`,
  '',
  ...USERS.map(u =>
    `${u.name} (${u.role})\n  Email:    ${u.email}\n  Password: ${u.password}\n  ID:       ${ids[u.tag]}`
  ),
  '',
  `Generado: ${new Date().toISOString()}`,
].join('\n');

writeFileSync(join(process.cwd(), 'scripts', 'seed-demo.credentials.txt'), lines);
console.log('  • scripts/seed-demo.credentials.txt escrito');

console.log('\n✅ seed-demo-users.ts completado.');
console.log('   Sigue con: npx tsx scripts/seed-demo-content.ts');
