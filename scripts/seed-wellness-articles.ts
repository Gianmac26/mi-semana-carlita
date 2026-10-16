// scripts/seed-wellness-articles.ts
// Upsert SOLO de los artículos de "Para leer" (Bienestar) en global_resources, por slug.
// No toca ninguna otra tabla. Idempotente: se puede correr varias veces.
// Contenido: scripts/wellness-articles.ts (misma fuente que usa seed-demo-content.ts).
//
// Nota: "Para leer" en WellnessTab lee global_resources (no wellness_resources, que son los
// recursos por categoría: crisis, tca, bullying, violencia, emociones, valores).
//
// Uso: npx tsx scripts/seed-wellness-articles.ts

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { ARTICLES, articlePublishedAt } from './wellness-articles';

// Carga .env.local sin dotenv (igual que seed-demo-content.ts).
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

async function main() {
  console.log(`\n── global_resources: ${ARTICLES.length} artículos de "Para leer"`);

  const base = Date.now();
  for (const [i, a] of ARTICLES.entries()) {
    // created_by se omite: en filas existentes se conserva; en nuevas queda null (columna opcional).
    const { error } = await supa.from('global_resources').upsert(
      {
        slug: a.slug, title: a.title, summary: a.summary, body_markdown: a.body_markdown,
        category: a.category, emoji: a.emoji, active: true,
        published_at: articlePublishedAt(i, base),
      },
      { onConflict: 'slug' }
    );
    if (error) throw new Error(`Upsert artículo ${a.slug}: ${error.message}`);
    console.log(`  • ${a.emoji} ${a.slug} (${a.body_markdown.length} caracteres)`);
  }

  console.log('\n✅ seed-wellness-articles.ts completado.');
}

main().catch(err => {
  console.error('Error en seed-wellness-articles:', err);
  process.exit(1);
});
