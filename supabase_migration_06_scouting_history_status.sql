-- Oficina del Entrenador — migración 06
-- Añade: estado (Observación/Contactado/Descartado) a la lista de
-- seguimiento de fichajes, e histórico de informes de rival por jornada.
-- Ejecutar en el SQL Editor de Supabase.

alter table scouting_targets add column if not exists status text not null default 'Observación';

create table if not exists scouting_reports (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  opponent text,
  system text,
  notes text,
  created_at timestamptz not null default now()
);
alter table scouting_reports enable row level security;
create policy "scouting_reports_owner" on scouting_reports for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
