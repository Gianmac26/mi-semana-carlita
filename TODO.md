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
- [ ] `ThemeToggle`, `ThemePicker`, `AvatarPicker`: cambiar `useRef(createBrowserClient())` → `useState(() => createBrowserClient())` para lazy init real (ya aplicado en MiMundoTab en Fase 6)

## Deuda técnica — Módulo 0A Fase 5 (contraste)

- [ ] Contraste marginal: minimalista dark (3.45:1) y neutro_elegante dark (3.63:1) en on-accent. Pasan el umbral UI-only (3:1) pero no el de texto normal (4.5:1). Los labels de botón son 13-15px bold — revisar si vale subir el contraste o aceptar como decisión de paleta.
- [ ] Contraste: rosa_suave light/dark tiene accent sobre bg-card ≈2.8:1 (accent como COLOR DE TEXTO, documentado en themes.ts). Issue distinto del on-accent (ya corregido en Fase 5). Evaluar si se acepta como diseño o se corrige.

## Limpieza de features específicas de Carlita (post Módulo 0A)

- [ ] Eliminar "🏠 Me quedé en casa" y todo el sistema de "salidas con amigos"
      - Buscar en components/WeekTab.tsx y lib/types.ts
      - También revisar RESERVED_SLUGS en AdminTab.tsx
- [ ] Revisar si hay otras features residuales del uso personal:
      - Cualquier campo en DayState que no sea notes/skipped/taskId
      - Cualquier sección en AdminTab con slug reservado

## UX gaps
- [ ] Pantallas no-profile-first y no-profile-code sin botón "Salir". Un usuario atrapado ahí no puede cambiar de cuenta sin limpiar cookies. Fix sugerido: botón "Salir" discreto arriba a la derecha.

## Mi mundo — deuda futura
- [ ] Considerar permitir que el hijo borre respuestas de más de N semanas.
- [ ] Considerar un modo de "solo lectura" para que el hijo vea su histórico antiguo como un diario.
- [ ] El padre ve el histórico completo hoy. Si se vuelve privado en el futuro, agregar toggle por familia.
