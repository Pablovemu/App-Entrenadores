-- Oficina del Entrenador — migración 5 (ejecutar una sola vez en el SQL
-- Editor de Supabase, después de supabase_migration_04_match_duration.sql).
-- Convierte cada sesión de entrenamiento en un plan con varios ejercicios
-- ordenados, agrupados por bloque (Calentamiento / Principal / Vuelta a la
-- calma), cada uno con su propia duración.

create table if not exists session_items (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id bigint not null references training_sessions(id) on delete cascade,
  position int not null default 0,
  block text not null default 'Principal',
  exercise_id bigint references exercises(id) on delete set null,
  name text not null,
  duration_minutes int,
  notes text
);
alter table session_items enable row level security;
drop policy if exists "session_items_owner" on session_items;
create policy "session_items_owner" on session_items for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "session_items_admin_all" on session_items;
create policy "session_items_admin_all" on session_items for all
  using (is_admin_user());
