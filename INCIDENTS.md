# Incidents & Pre-Production Findings

Registro de hallazgos críticos detectados antes o durante la ejecución de migraciones y deploys.

---

## INC-001 — Migración 003 borraría el 100% de `weekly_state`

**Proyecto:** mi-semana-carlita (Supabase: `owyqwxbyoohcuzphhbyn`)
**Fecha:** 2026-10-08
**Estado:** ✅ Resuelto en código — pendiente de ejecución
**Severidad:** Alta (pérdida de datos si se ejecuta sin precondición)

### Contexto

La migración `003_multi_hijo_weekly_state.sql` incluía un `DELETE` de filas "huérfanas" de `weekly_state`: filas cuyo `family_id` no tiene ningún perfil con `role = 'hijo'` en `profiles`. La verificación previa reveló que el 100% de las filas existentes caen en esta categoría.

### Backup previo

CSV descargado desde Table Editor el 2026-10-08: `weekly_state_backup_2026-10-08.csv`

| id | family_id | week_key | day | state |
|---|---|---|---|---|
| 20ef4ca6-b013-4a9a-b407-e8e3501c1d42 | 6a74b0a6-8001-466d-aefb-40f782ff9427 | 2026-09-21 | mon | `{"ir_al_cole":false}` |

### Queries de diagnóstico ejecutadas

```sql
-- 1. Estado de weekly_state
SELECT family_id, COUNT(*) AS total_filas, COUNT(DISTINCT week_key) AS semanas
FROM weekly_state GROUP BY family_id;
-- Resultado: 1 familia, 1 fila, 1 semana
```

```sql
-- 2. Hijos registrados por familia
SELECT f.id AS family_id, COUNT(p.id) AS hijos_registrados
FROM (SELECT DISTINCT family_id AS id FROM weekly_state) f
LEFT JOIN profiles p ON p.family_id = f.id AND p.role = 'hijo'
GROUP BY f.id;
-- Resultado: 0 hijos en la familia 6a74b0a6-…
```

```sql
-- 3. Simulación del DELETE
SELECT COUNT(*) AS filas_que_se_borraran
FROM weekly_state ws
WHERE NOT EXISTS (
  SELECT 1 FROM profiles p
  WHERE p.family_id = ws.family_id AND p.role = 'hijo'
);
-- Resultado: 1 (100% de la tabla)
```

```sql
-- 4. Diagnóstico de profiles
SELECT family_id, role, COUNT(*) FROM profiles GROUP BY family_id, role;
-- Resultado: familia 6a74b0a6-… tiene 2 perfiles role='padre', 0 role='hijo'
```

### Causa raíz

Carlita (la hija para quien está construida la app) no tiene perfil en `profiles`. El estado semanal existente fue creado con perfiles padre durante el desarrollo. La regla de huérfanos de la migración clasifica esas filas como candidatas al DELETE porque no hay ningún hijo registrado en la familia.

### Corrección aplicada

El `DELETE` silencioso en `003_multi_hijo_weekly_state.sql` fue reemplazado por un guard `DO $$` que aborta con `RAISE EXCEPTION` si quedan filas sin `user_id` después del backfill. El DELETE queda comentado para decisión explícita del operador.

Ver: `supabase/migrations/003_multi_hijo_weekly_state.sql` paso 3.

### Precondición para ejecutar la migración

1. Crear el perfil de Carlita con `role = 'hijo'` en la familia `6a74b0a6-8001-466d-aefb-40f782ff9427` vía el flujo de código de invitación de la app (Admin → Invitaciones → "+ Código para hijo/a")
2. Volver a correr la Query 3 — debe devolver `0`
3. Ejecutar `003_multi_hijo_weekly_state.sql`
4. Si algo falla: restaurar desde `weekly_state_backup_2026-10-08.csv`

### Nota de diseño

- El flujo de auth requiere email. Carlita puede usar un alias del padre (`email+carlita@gmail.com`) si no tiene cuenta propia.
- Gap documentado: no hay ruta de login para usuarios sin email. Candidato a módulo futuro (login por PIN/código de invitación directo).
