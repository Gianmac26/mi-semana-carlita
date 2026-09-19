import { createClient } from '@supabase/supabase-js';

const {
  NEXT_PUBLIC_SUPABASE_URL: URL,
  SUPABASE_SERVICE_ROLE_KEY: SERVICE_KEY,
  JSONBIN_API_KEY: JSONBIN_KEY,
  JSONBIN_BIN_ID: BIN_ID,
  FAMILY_ID,
  PADRE_USER_ID,
} = process.env;

if (!URL || !SERVICE_KEY || !JSONBIN_KEY || !BIN_ID || !FAMILY_ID || !PADRE_USER_ID) {
  console.error('Missing env vars. Required: NEXT_PUBLIC_SUPABASE_URL SUPABASE_SERVICE_ROLE_KEY JSONBIN_API_KEY JSONBIN_BIN_ID FAMILY_ID PADRE_USER_ID');
  process.exit(1);
}

const supa = createClient(URL, SERVICE_KEY);

// ── Legacy task seed data (mirrors lib/tasks.ts) ─────────────────────────────
const WEEKDAY_TASKS = [
  { slug: 'llegada_cole', icon: '🏫', label: 'Llegada al cole a tiempo',       time: '7:45 am',       skippable: false, sort_order: 0 },
  { slug: 'llegada',      icon: '🏠', label: 'Llegada a casa a tiempo',         time: '2:20 pm',       skippable: false, sort_order: 1 },
  { slug: 'almuerzo',     icon: '🍽️', label: 'Cambio de ropa + almuerzo',      time: '2:30–3:00 pm',  skippable: false, sort_order: 2 },
  { slug: 'ducha',        icon: '🚿', label: 'Ducha y lista para estudiar',     time: '3:30 pm',       skippable: false, sort_order: 3 },
  { slug: 'estudio',      icon: '📖', label: 'Estudio sin celular',             time: '4:00–5:30 pm',  skippable: false, sort_order: 4 },
  { slug: 'regreso',      icon: '🌟', label: 'Regreso de salir con amigas',     time: '7:30 pm',       skippable: true,  sort_order: 5 },
  { slug: 'dormir',       icon: '🌙', label: 'Celular fuera de la cama y a dormir', time: '10:00 pm', skippable: false, sort_order: 6 },
];

const SATURDAY_TASKS = [
  { slug: 'cuadernos',   icon: '📓', label: 'Revisión de cuadernos con mamá', time: '',       skippable: false, sort_order: 0 },
  { slug: 'regreso_sab', icon: '🌆', label: 'Regreso de salir con amigas',    time: '8:00 pm', skippable: true, sort_order: 1 },
];

async function fetchJsonBin(): Promise<{ weeks: Record<string, Record<string, unknown>>; events: Array<{ date: string; time: string; label: string }> }> {
  const res = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`, {
    headers: { 'X-Master-Key': JSONBIN_KEY! },
  });
  if (!res.ok) throw new Error(`JSONBin fetch failed: ${res.status}`);
  const json = await res.json();
  return json.record ?? json;
}

async function seedTasks() {
  console.log('Seeding tasks...');
  const rows = [
    ...WEEKDAY_TASKS.map(t => ({ ...t, family_id: FAMILY_ID, day_type: 'weekday', active: true })),
    ...SATURDAY_TASKS.map(t => ({ ...t, family_id: FAMILY_ID, day_type: 'saturday', active: true })),
  ];
  const { error } = await supa.from('tasks').upsert(rows, { onConflict: 'family_id,slug' });
  if (error) throw new Error(`Tasks seed failed: ${error.message}`);
  console.log(`  ✓ ${rows.length} tasks seeded`);
}

async function migrateWeeks(weeks: Record<string, Record<string, unknown>>) {
  console.log('Migrating weekly_state...');
  const upserts: { family_id: string; week_key: string; day: string; state: unknown }[] = [];
  for (const [weekKey, weekData] of Object.entries(weeks)) {
    for (const [day, state] of Object.entries(weekData)) {
      if (state && Object.keys(state as object).length > 0) {
        upserts.push({ family_id: FAMILY_ID!, week_key: weekKey, day, state });
      }
    }
  }
  if (upserts.length === 0) { console.log('  ✓ No week data to migrate'); return; }
  const { error } = await supa.from('weekly_state').upsert(upserts, { onConflict: 'family_id,week_key,day' });
  if (error) throw new Error(`weekly_state migration failed: ${error.message}`);
  console.log(`  ✓ ${upserts.length} day-rows migrated`);
}

async function migrateEvents(events: Array<{ date: string; time: string; label: string }>) {
  console.log('Migrating events...');
  if (!events.length) { console.log('  ✓ No events to migrate'); return; }
  const rows = events.map(e => ({
    family_id: FAMILY_ID,
    date: e.date,
    time: e.time ?? '',
    label: e.label,
    created_by: PADRE_USER_ID,
  }));
  const { error } = await supa.from('events').insert(rows);
  if (error) throw new Error(`Events migration failed: ${error.message}`);
  console.log(`  ✓ ${rows.length} events migrated`);
}

async function main() {
  console.log('Starting migration...\n');
  const data = await fetchJsonBin();
  await seedTasks();
  await migrateWeeks(data.weeks ?? {});
  await migrateEvents(data.events ?? []);
  console.log('\n✅ Migration complete. mi_mundo entries require manual migration (needs per-user author_id).');
}

main().catch(err => { console.error(err); process.exit(1); });
