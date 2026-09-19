# Mi Semana — Carlita

Tracker semanal de responsabilidades para Carlita. Login con Google. Dos roles: `padre` (admin) y `hijo`.

## Correr localmente

```bash
npm install
npm run dev
```

Abre http://localhost:3000

## Variables de entorno

Crea `.env.local` con:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

En Vercel estas variables se configuran en **Settings → Environment Variables**.

## Stack

- Next.js 16 (App Router) · TypeScript · React
- Supabase (Auth + Postgres + RLS)
- Login con Google OAuth
- Roles: `padre` (puede crear tareas, invitar, ver Mi Mundo) / `hijo`

## Setup inicial

1. Crea un proyecto en Supabase
2. Activa Google OAuth en Authentication → Providers
3. Añade `http://localhost:3000/auth/callback` a los Redirect URLs permitidos
4. Ejecuta `supabase/migrations/001_initial_schema.sql` en el SQL Editor
5. El primer usuario en hacer login se convierte en `padre` y crea la familia
6. Para invitar a un hijo/a: **Admin → Invitaciones → Generar código**

## Limitaciones conocidas

- **Porcentajes históricos en Progreso:** La pantalla "Últimas semanas" calcula el porcentaje de cumplimiento usando la lista de tareas *activa hoy*, no las que existían en esa semana. Si el padre agrega o elimina tareas, los porcentajes históricos cambian retroactivamente. Es el comportamiento esperado dado que las tareas son editables; no es un bug. Si en el futuro se requiere precisión histórica, hay que guardar un snapshot de qué tareas estaban activas por semana (columna `activated_at` / `deactivated_at` en la tabla `tasks`).

## Migración desde JSONBin

Ver `scripts/migrate-jsonbin-to-supabase.ts`. Requiere:
- `JSONBIN_API_KEY`, `JSONBIN_BIN_ID` (credenciales del bin original)
- `FAMILY_ID`, `PADRE_USER_ID` (UUIDs del proyecto Supabase, después del primer login)
