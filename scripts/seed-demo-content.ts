// scripts/seed-demo-content.ts
// Paso 2 de 2 del seed demo.
// Crea: tareas (8), eventos (3), mi_mundo_entries (8), global_resources (3).
// Prerrequisito: seed-demo-users.ts ya corrido (familia + profiles en DB).
//
// Uso: npx tsx scripts/seed-demo-content.ts

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Carga .env.local sin dotenv
// NOTA: no maneja comillas con contenido interno. Suficiente para el demo.
try {
  for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.+)$/);
    if (m) (process.env[m[1]] as string | undefined) ??= m[2].replace(/^['"]|['"]$/g, '');
  }
} catch {}

const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPA_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPA_URL || !SUPA_KEY) {
  console.error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local');
  process.exit(1);
}

const supa = createClient(SUPA_URL, SUPA_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Helper: construye strings markdown sin saltos literales en el código fuente
const md = (...lines: string[]) => lines.join('\n');

// ── Lookup: obtiene familyId y userIds desde la DB ────────────────────────────

console.log('\n── Lookup de datos del paso 1');

const { data: fam, error: famErr } = await supa
  .from('families').select('id').eq('name', 'Familia Demo GlobalTec').single();
if (famErr || !fam) {
  console.error('Familia demo no encontrada. ¿Corriste seed-demo-users.ts primero?');
  process.exit(1);
}
const familyId: string = fam.id;
console.log(`  • familia: ${familyId}`);

const BASE = 'gian.marcal26@gmail.com';
const alias = (tag: string) => BASE.replace('@', `+${tag}@`);

const { data: profileRows } = await supa
  .from('profiles').select('id, email, role').eq('family_id', familyId);
if (!profileRows || profileRows.length === 0) {
  console.error('Profiles demo no encontrados. ¿Corriste seed-demo-users.ts primero?');
  process.exit(1);
}

const ids: Record<string, string> = {};
for (const p of profileRows) {
  if (p.email === alias('padre.demo')) ids['padre.demo'] = p.id;
  if (p.email === alias('hijo1.demo')) ids['hijo1.demo'] = p.id;
  if (p.email === alias('hijo2.demo')) ids['hijo2.demo'] = p.id;
}

const { data: adminRow } = await supa
  .from('global_admins').select('id').eq('email', alias('admin.demo')).single();
if (!adminRow) {
  console.error('global_admin demo no encontrado. ¿Corriste seed-demo-users.ts primero?');
  process.exit(1);
}
ids['admin.demo'] = adminRow.id;

const missingIds = ['padre.demo','hijo1.demo','hijo2.demo','admin.demo'].filter(k => !ids[k]);
if (missingIds.length > 0) {
  console.error(`IDs no encontrados: ${missingIds.join(', ')}. Verifica seed-demo-users.ts.`);
  process.exit(1);
}
console.log(`  • userIds: ${Object.keys(ids).join(', ')}`);

// ── 1. tasks ─────────────────────────────────────────────────────────────────

console.log('\n── 1. tasks');

const TASKS = [
  { slug: 'ir_al_colegio',    icon: '🏫', label: 'Ir al colegio',              time: '07:00', days: ['lun','mar','mie','jue','vie'],             skippable: false, sort_order: 0 },
  { slug: 'hacer_tarea',      icon: '📝', label: 'Hacer la tarea del colegio', time: '16:00', days: ['lun','mar','mie','jue'],                   skippable: false, sort_order: 1 },
  { slug: 'leer_20min',       icon: '📖', label: 'Leer 20 minutos',             time: '17:00', days: ['lun','mar','mie','jue','vie'],             skippable: false, sort_order: 2 },
  { slug: 'ordenar_cuarto',   icon: '🧹', label: 'Ordenar mi cuarto',           time: '18:00', days: ['lun','mie','vie'],                        skippable: false, sort_order: 3 },
  { slug: 'practicar_ingles', icon: '🗣️', label: 'Practicar inglés',            time: '17:30', days: ['lun','mie','vie'],                        skippable: true,  sort_order: 4 },
  { slug: 'ayudar_en_casa',   icon: '🏠', label: 'Ayudar en casa',              time: '10:00', days: ['sab'],                                    skippable: false, sort_order: 5 },
  { slug: 'deporte',          icon: '⚽', label: 'Hacer deporte',               time: '09:00', days: ['mar','jue','sab'],                        skippable: false, sort_order: 6 },
  { slug: 'dormir_temprano',  icon: '🌙', label: 'Apagar el celular y dormir',  time: '22:00', days: ['lun','mar','mie','jue','vie','sab','dom'], skippable: false, sort_order: 7 },
];

for (const t of TASKS) {
  const { error } = await supa.from('tasks').upsert(
    { family_id: familyId, slug: t.slug, icon: t.icon, label: t.label,
      time: t.time, days: t.days, skippable: t.skippable, sort_order: t.sort_order, active: true },
    { onConflict: 'family_id,slug' }
  );
  if (error) throw new Error(`Upsert task ${t.slug}: ${error.message}`);
  console.log(`  • ${t.icon} ${t.label}`);
}

// ── 2. events ────────────────────────────────────────────────────────────────

console.log('\n── 2. events');

function daysFromNow(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

const EVENTS = [
  { date: daysFromNow(3),  time: '18:00', label: 'Reunión de padres en el colegio' },
  { date: daysFromNow(10), time: '09:00', label: 'Excursión al museo de ciencias'   },
  { date: daysFromNow(30), time: '',      label: 'Vacaciones de verano'             },
];

for (const ev of EVENTS) {
  const { data: existing } = await supa
    .from('events').select('id').eq('family_id', familyId).eq('label', ev.label);
  if (existing && existing.length > 0) {
    console.log(`  • ya existe: "${ev.label}"`);
    continue;
  }
  const { error } = await supa.from('events').insert({
    family_id:  familyId,
    date:       ev.date,
    time:       ev.time,
    label:      ev.label,
    created_by: ids['padre.demo'],
  });
  if (error) throw new Error(`Insert event "${ev.label}": ${error.message}`);
  console.log(`  • ${ev.date} — ${ev.label}`);
}

// ── 3. mi_mundo_entries ──────────────────────────────────────────────────────

console.log('\n── 3. mi_mundo_entries');

const MI_MUNDO: { tag: string; key: string; value: string }[] = [
  { tag: 'hijo1.demo', key: 'favorito', value: 'Mi color favorito es el morado y me encanta la música pop' },
  { tag: 'hijo1.demo', key: 'sueno',    value: 'Quiero ser veterinaria cuando sea grande'                  },
  { tag: 'hijo1.demo', key: 'logro',    value: 'Aprendí a tocar la guitarra este año'                      },
  { tag: 'hijo1.demo', key: 'miedo',    value: 'Le tengo miedo a las arañas'                               },
  { tag: 'hijo2.demo', key: 'favorito', value: 'Me encantan los videojuegos y el fútbol'                   },
  { tag: 'hijo2.demo', key: 'sueno',    value: 'Quiero ser programador o astronauta'                       },
  { tag: 'hijo2.demo', key: 'logro',    value: 'Salí campeón del torneo de ajedrez del colegio'            },
  { tag: 'hijo2.demo', key: 'miedo',    value: 'Me dan miedo las tormentas eléctricas'                     },
];

for (const e of MI_MUNDO) {
  const { error } = await supa.from('mi_mundo_entries').upsert(
    { family_id: familyId, author_id: ids[e.tag], key: e.key, value: e.value },
    { onConflict: 'family_id,author_id,key' }
  );
  if (error) throw new Error(`Upsert mi_mundo ${e.tag}.${e.key}: ${error.message}`);
  console.log(`  • ${e.tag} → ${e.key}`);
}

// ── 4. global_resources ──────────────────────────────────────────────────────

console.log('\n── 4. global_resources');

const RESOURCES = [
  {
    slug:          'cuarto-y-animo',
    emoji:         '🧹',
    category:      'bienestar' as const,
    title:         'Tu cuarto y tu estado de ánimo',
    summary:       'El orden de tu espacio afecta cómo te sientes y cuánto rindes.',
    body_markdown: md(
      '## Tu cuarto y tu estado de ánimo',
      '',
      'Cuando tu cuarto está ordenado, tu mente también lo está. El desorden visual consume energía mental sin que te des cuenta.',
      '',
      '**Prueba esto:** dedica 10 minutos al día a ordenar antes de estudiar. Notarás la diferencia.'
    ),
  },
  {
    slug:          'estudiar-poco-poco',
    emoji:         '📖',
    category:      'estudio' as const,
    title:         'Por qué estudiar poco a poco funciona',
    summary:       'El cerebro retiene más con sesiones cortas y frecuentes que con una sola larga.',
    body_markdown: md(
      '## Por qué estudiar poco a poco funciona mejor',
      '',
      'Estudiar 30 minutos al día es más efectivo que 3 horas el día antes del examen. Esto se llama **práctica distribuida** y tiene respaldo científico.',
      '',
      '**Cómo aplicarlo:** divide el material en partes pequeñas y trabaja una cada día.'
    ),
  },
  {
    slug:          'el-poder-del-abrazo',
    emoji:         '🤗',
    category:      'valores' as const,
    title:         'El poder del abrazo familiar',
    summary:       'El contacto físico con tu familia reduce el estrés y fortalece los lazos.',
    body_markdown: md(
      '## El poder del abrazo familiar',
      '',
      'Un abrazo de 20 segundos libera oxitocina, la hormona del bienestar. No importa la edad: todos necesitamos sentir cercanía.',
      '',
      'Las familias que expresan afecto físico tienen hijos con mayor autoestima y menor ansiedad.'
    ),
  },
];

for (const r of RESOURCES) {
  const { error } = await supa.from('global_resources').upsert(
    { slug: r.slug, title: r.title, summary: r.summary, body_markdown: r.body_markdown,
      category: r.category, emoji: r.emoji, active: true,
      published_at: new Date().toISOString(), created_by: ids['admin.demo'] },
    { onConflict: 'slug' }
  );
  if (error) throw new Error(`Upsert resource ${r.slug}: ${error.message}`);
  console.log(`  • ${r.emoji} ${r.title}`);
}

console.log('\n✅ seed-demo-content.ts completado.');
console.log('   Seed demo completo. Revisa scripts/seed-demo.credentials.txt para las credenciales.');
