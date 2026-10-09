-- ── Mi-semana — Reset de desarrollo ─────────────────────────────────────────
-- Borra todo el schema de aplicación para empezar desde cero.
-- SOLO para entornos de desarrollo. NUNCA en producción.
--
-- Uso:
--   1. Correr este archivo en SQL Editor de Supabase (proyecto de desarrollo)
--   2. Correr supabase/migrations/001_schema.sql
--   3. Correr scripts/seed-demo.ts

-- Funciones RPC (antes que tablas, para evitar conflictos de dependencia)
drop function if exists get_global_metrics()     cascade;
drop function if exists auth_family_id()         cascade;
drop function if exists auth_role()              cascade;
drop function if exists is_global_admin()        cascade;

-- Tablas de admin global
drop table if exists global_resources   cascade;
drop table if exists global_admins      cascade;

-- Tablas de familia (orden respeta FK: hijos antes que padres)
drop table if exists weekly_state       cascade;
drop table if exists mi_mundo_entries   cascade;
drop table if exists invite_codes       cascade;
drop table if exists events             cascade;
drop table if exists tasks              cascade;
drop table if exists profiles           cascade;
drop table if exists families           cascade;
