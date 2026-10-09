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

## Sistema de paletas (Módulo 0A)

La app soporta 8 paletas definidas en `lib/themes.ts`. El sistema funciona con atributos CSS en `<html>`:

- `data-palette="vibrante"` (u otra) → selecciona la paleta
- `data-mode="light|dark"` (ausente = auto) → fuerza modo claro/oscuro

Los CSS custom properties se definen en `app/globals.css` usando selectores de atributo:
```css
:root[data-palette="vibrante"] { --accent: #D4380D; ... }
:root[data-palette="vibrante"][data-mode="dark"] { --accent: #FF7043; ... }
```

### Agregar una paleta nueva

1. En `lib/themes.ts`: añadir la paleta al array `PALETTES` con `id`, `name`, `emoji`, `light` y `dark` (todos los tokens de `PaletteTokens`).
2. En `app/globals.css`: añadir dos bloques — light y dark — siguiendo el patrón existente.
3. Actualizar `PaletteId` en `lib/themes.ts` para incluir el nuevo id.
4. Si el rol debe tener esa paleta por defecto: actualizar `ROLE_DEFAULT_PALETTE` en `lib/themes.ts` **y** el trigger `create_user_preferences()` en la migración SQL.

**Nota:** `--pink` y `--pink-soft` son alias backwards-compat que siguen a `--accent` y `--accent-soft` automáticamente vía `:root { --pink: var(--accent); }`.

## Sistema de avatares (Módulo 0A)

Los avatares son emojis preset definidos en `components/AvatarPicker.tsx` (`PRESET_AVATARS`). Cada uno tiene un color de fondo fijo (no depende de la paleta activa — un zorro naranja sigue naranja en cualquier paleta).

El emoji seleccionado se guarda como `avatar_url` en `user_preferences` (campo texto, no una URL real). El `avatar_type` es siempre `'preset'` en esta fase.

Para agregar avatares: añadir entradas a `PRESET_AVATARS` en `AvatarPicker.tsx` con `{ emoji, bg }`.

## Limitaciones conocidas

- **Porcentajes históricos en Progreso:** La pantalla "Últimas semanas" calcula el porcentaje de cumplimiento usando la lista de tareas *activa hoy*, no las que existían en esa semana. Si el padre agrega o elimina tareas, los porcentajes históricos cambian retroactivamente. Es el comportamiento esperado dado que las tareas son editables; no es un bug. Si en el futuro se requiere precisión histórica, hay que guardar un snapshot de qué tareas estaban activas por semana (columna `activated_at` / `deactivated_at` en la tabla `tasks`).

- **Migración previa bloquea el primer login como padre:** Si corriste el script de migración (`migrate-jsonbin-to-supabase.ts`) antes de que ningún usuario real se registrara, la tabla `families` ya tiene una fila pero `profiles` está vacía. En versiones anteriores `/api/onboard` contaba `families` para detectar al primer usuario — como la family ya existía, nadie podía registrarse como padre. **Fix aplicado (2026-09-19):** el check ahora cuenta `profiles === 0`, no `families === 0`, y reutiliza la family existente en vez de crear una nueva. Si quedás bloqueado en la pantalla de código después de una migración, corre el script de desbloqueo: `scripts/create-first-padre.ts`.

## Migración desde JSONBin

Ver `scripts/migrate-jsonbin-to-supabase.ts`. Requiere:
- `JSONBIN_API_KEY`, `JSONBIN_BIN_ID` (credenciales del bin original)
- `FAMILY_ID`, `PADRE_USER_ID` (UUIDs del proyecto Supabase, después del primer login)
