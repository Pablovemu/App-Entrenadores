-- Oficina del Entrenador — migración 08
-- Ficha de ejercicio más completa (nº de jugadores, material, variante de
-- otro ejercicio, favorito) y objetivo de la sesión de entrenamiento.
-- Ejecutar en el SQL Editor de Supabase.

alter table exercises add column if not exists players_needed int;
alter table exercises add column if not exists equipment text;
alter table exercises add column if not exists favorite boolean not null default false;
alter table exercises add column if not exists variant_of bigint references exercises(id) on delete set null;

alter table training_sessions add column if not exists objective text;
