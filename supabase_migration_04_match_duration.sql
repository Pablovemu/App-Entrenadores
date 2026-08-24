-- Oficina del Entrenador — migración 4 (ejecutar una sola vez en el SQL
-- Editor de Supabase, después de supabase_migration_03_stats_calendar_match.sql).
-- Añade la duración total del partido (para poder calcular el % de minutos
-- disputados por cada jugador sobre el total de la temporada).

alter table matches add column if not exists duration_seconds int not null default 0;
