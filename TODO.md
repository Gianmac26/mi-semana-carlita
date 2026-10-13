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

## Deuda técnica — RLS de recursos

- [ ] wellness_resources Y global_resources: la policy SELECT usa active=true sin excepción para admin. Un admin que desactive un recurso no podrá verlo ni reactivarlo. Fix: (active = true or is_global_admin()).
      - wellness_resources: ya aplicado en `005_wellness_resources.sql` (pendiente de ejecutar en Supabase).
      - global_resources: pendiente (policy "authenticated users can read active resources" en `001_schema.sql`).

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

## Pre-demo — verificación de contenido de bienestar

Verificación del 2026-10-10 contra fuentes oficiales (gob.pe/MINSA, gob.pe/MIMP, siseve.minedu.gob.pe).

- [x] Línea 113 opción 5 — verificado
- [ ] WhatsApp MINSA 955 557 000 / 952 842 623 — PENDIENTE: confirmar vigencia con llamada/mensaje de prueba (solo aparece en cobertura de una campaña puntual, no fuente permanente)
- [x] SíseVe teléfono — CORREGIDO a (01) 615-5970 el 2026-10-10
- [x] SíseVe WhatsApp 991 410 000 — verificado
- [x] Línea 100 — verificado
- [ ] Chat 100 (chat100.mimp.gob.pe) — PENDIENTE: abrir la URL a mano para confirmar que carga (el fetch automático fue bloqueado)
- [ ] Educación Te Escucha (Minedu) — PENDIENTE: verificar WhatsApp 983 098 972, correo educacionteescucha@minedu.gob.pe, y vigencia del programa. Aparece en HelpButton pero no estaba en la lista original.

## Bienestar (Módulo 2, Fase 3) — estado
- [x] Migración 005 aplicada en Supabase (verificado 2026-10-10)
- [x] Seed corrido: 8 fichas insertadas (verificado 2026-10-10)
- [x] Distribución: crisis 1, tca 1, bullying 2, violencia 1, emociones 1, valores 2
- [x] Tab "💚 Bienestar" desplegada en producción (commit cccc56b)

## Task completions — deuda Fase 2
- [x] Al implementar aprobación/rechazo: la UI debe bloquear el toggle de tareas
      aprobadas en TaskItem y TaskDetailSheet. El RLS ya lo impide (update policy
      exige status='done'), pero la UI debe mostrar el estado "Aprobada" sin permitir
      desmarcar. Sin esto, el hijo intentará desmarcar y recibirá un error de RLS
      en vez de feedback visual.

## Task completions — deuda post-Fase 1
- [ ] Limitar la query de `task_completions` a las últimas 8 semanas cuando haya historial real (hoy carga todo, igual que weekly_state).
- [ ] Sin backfill, las tareas marcadas en el JSONB de demo aparecen sin marcar tras el despliegue. Aceptable: los datos demo no importan. No repetir el problema cuando existan familias reales.

## Task completions — deuda post-Fase 2
- [ ] El padre no puede deshacer una revisión: el trigger `enforce_completion_review_columns` (007) solo permite revisar desde `status = 'done'`. Si se necesita "cambiar de opinión" (approved ↔ rejected, o volver a done), ajustar el trigger y la UI de AdminTab.

## Task completions — deuda post-Fase 2 (cont.)
- [ ] Sin Supabase Realtime: el padre solo ve completions pendientes al recargar la app. El hijo solo ve aprobaciones/rechazos al recargar. Para el demo basta con recargar. Mejora futura: Realtime o refresh al cambiar de pestaña.

## Fase 2 — mejoras opcionales (post-demo)
- [ ] Badge rojo en la nav del Admin (BottomNav) cuando hay completions pendientes. Hoy el contador está en el botón "✅ Revisar (N)" dentro de AdminTab, que es suficiente para el demo.

## Gamificación — deuda Fase 3
- [x] Streaks: el INSERT lazy + SELECT ... FOR UPDATE serializa aprobaciones simultáneas del mismo hijo. Documentado como defensa. Sin bug activo.
- [ ] Aprobaciones fuera de orden cronológico no extienden la racha hacia atrás. Mejora futura: trackear días contabilizados o forzar revisión en orden cronológico.
- [ ] week_complete "≥5 aprobaciones" es arbitrario. Revisar cuando haya familias con menos de 5 tareas por semana (alternativa: 80% de las asignadas).
- [ ] Smoke test del trigger con UPDATE manual: pendiente al inicio de Parte 2.
- [ ] PointsBadge (Parte 2): calcular "hoy" en zona America/Lima (Intl.DateTimeFormat con timeZone: 'America/Lima'), no con el TZ del navegador. Sin esto, un hijo en otra zona vería su racha rota a las 9pm.

## Gamificación — deuda Fase 3 (cont.)
- [ ] Retroactividad: cuando se aplicó la 008, las 7 aprobaciones previas de Sofía no otorgaron puntos ni insignias retroactivamente. Solo se aplica hacia adelante. Si en el futuro queremos dar insignias retroactivas, hay que reprocesar el histórico.
