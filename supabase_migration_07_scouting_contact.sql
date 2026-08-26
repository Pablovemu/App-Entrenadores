-- Oficina del Entrenador — migración 07
-- Añade el número de contacto a la lista de seguimiento de fichajes.
-- Ejecutar en el SQL Editor de Supabase.

alter table scouting_targets add column if not exists contact text;
