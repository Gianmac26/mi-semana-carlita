# TODO — Deudas técnicas y mejoras pendientes

## UX

- **Pantalla de bienvenida (`no-profile-first`):** El botón "Tengo un código de invitación" debería ser más prominente que "Entrar como papá/mamá" cuando ya existen otras familias. Actualmente el botón rosa grande aparece primero; la mayoría de usuarios nuevos (Andrea, Carlita) necesitarán el código, no la creación de familia.

- **Nombre de familia en onboarding:** El nombre está hardcodeado como `'Mi familia'` en `/api/onboard`. Permitir que el padre lo personalice durante el onboarding (campo de texto adicional en la pantalla de bienvenida).

- **GoldenRulesEditor — truncado de texto:** Los botones ▲▼🗑 ocupan espacio y el texto de la regla se trunca en pantallas pequeñas. Opciones: (a) botones en una fila aparte debajo del texto, (b) iconos más pequeños, (c) menú contextual ⋮ en vez de 3 botones.

## Antes del demo a GlobalTec (obligatorio)

- [ ] Rotar JWT secret en Supabase (Settings → JWT Keys). Invalida anon + service_role. Actualizar `.env.local` y Vercel.
- [ ] Rotar client secret de Google OAuth (por exposición en desarrollo).
- [ ] Revisar `.env.local` antes de cualquier screenshot público.
- [ ] Confirmar que `seed-demo.credentials.txt` no está commiteado.

## Deuda técnica — Módulo 0A Fase 2 (user_preferences)

- [ ] `user_preferences_update` policy: agregar `WITH CHECK (user_id = auth.uid())` (actualmente solo tiene `USING`)
- [ ] `create_user_preferences()`: agregar `SET search_path = public, pg_temp` (consistencia con otras funciones `SECURITY DEFINER`)
- [ ] `ThemeToggle`: mover `createBrowserClient()` a `useState(() => createBrowserClient())` para lazy init real (actualmente en `useRef` que igual crea el cliente en render)

## Limpieza de features específicas de Carlita (post Módulo 0A)

- [ ] Eliminar "🏠 Me quedé en casa" y todo el sistema de "salidas con amigos"
      - Buscar en components/WeekTab.tsx y lib/types.ts
      - También revisar RESERVED_SLUGS en AdminTab.tsx
- [ ] Revisar si hay otras features residuales del uso personal:
      - Cualquier campo en DayState que no sea notes/skipped/taskId
      - Cualquier sección en AdminTab con slug reservado
