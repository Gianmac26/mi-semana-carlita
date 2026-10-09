// scripts/seed-demo.ts
// Orquestador del seed demo para GlobalTec.
// No ejecuta los scripts directamente — cada uno debe correrse por separado
// para poder verificar el output y detectar errores antes del siguiente paso.
//
// Orden de ejecución:
//   1. npx tsx scripts/seed-demo-users.ts
//   2. npx tsx scripts/seed-demo-content.ts
//
// Prerrequisitos (en ese orden):
//   a. supabase/reset.sql ejecutado en Supabase SQL Editor
//   b. supabase/migrations/001_schema.sql ejecutado en Supabase SQL Editor
//   c. .env.local con NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY
//
// Resultado:
//   - 4 usuarios demo en auth.users (email_confirm: true, password fijo)
//   - 1 familia demo, 3 profiles, 1 global_admin
//   - 8 tareas, 3 eventos, 8 mi_mundo_entries, 3 global_resources
//   - scripts/seed-demo.credentials.txt con emails y passwords (en .gitignore)

console.log('Ejecuta los seeds en este orden:');
console.log('  1. npx tsx scripts/seed-demo-users.ts');
console.log('  2. npx tsx scripts/seed-demo-content.ts');
