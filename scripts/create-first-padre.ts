/**
 * One-time script: create a padre profile for the first Google-authenticated user
 * when the family already exists (created by migration) but profiles table is empty.
 *
 * Usage:
 *   SUPABASE_URL=https://xxxx.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=eyJ... \
 *   PADRE_EMAIL=your@email.com \
 *   DISPLAY_NAME="Tu nombre" \
 *   npx ts-node --project tsconfig.json scripts/create-first-padre.ts
 */
import { createClient } from '@supabase/supabase-js';

const url      = process.env.SUPABASE_URL!;
const key      = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const email    = process.env.PADRE_EMAIL!;
const name     = process.env.DISPLAY_NAME ?? email.split('@')[0];

if (!url || !key || !email) {
  console.error('Missing SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, or PADRE_EMAIL');
  process.exit(1);
}

const db = createClient(url, key);

async function run() {
  // 1. Find the auth user by email
  const { data: { users }, error: listErr } = await db.auth.admin.listUsers();
  if (listErr) throw listErr;
  const authUser = users.find(u => u.email === email);
  if (!authUser) {
    console.error(`No auth user found with email ${email}. Did they sign in with Google at least once?`);
    process.exit(1);
  }
  console.log(`Found auth user: ${authUser.id} (${authUser.email})`);

  // 2. Check profiles table
  const { count: profileCount } = await db
    .from('profiles').select('id', { count: 'exact', head: true });
  console.log(`Profiles in DB: ${profileCount}`);
  if ((profileCount ?? 0) > 0) {
    console.error('profiles table is not empty — aborting to avoid duplicate.');
    process.exit(1);
  }

  // 3. Get the existing family
  const { data: families, error: famErr } = await db.from('families').select('id').limit(1);
  if (famErr || !families?.length) {
    console.error('No family found. Run the migration script first.');
    process.exit(1);
  }
  const familyId = families[0].id;
  console.log(`Using family: ${familyId}`);

  // 4. Insert the padre profile
  const { data: profile, error: profErr } = await db.from('profiles').insert({
    id: authUser.id,
    family_id: familyId,
    role: 'padre',
    display_name: name,
    email: authUser.email ?? '',
  }).select().single();

  if (profErr) { console.error('Error inserting profile:', profErr); process.exit(1); }
  console.log('✅ Profile created:', profile);
}

run().catch(e => { console.error(e); process.exit(1); });
