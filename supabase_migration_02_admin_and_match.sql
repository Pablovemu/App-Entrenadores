-- Oficina del Entrenador — migración 2 (ejecutar una sola vez, después de
-- supabase_schema.sql): persistencia del Partido en Vivo + panel de admin.
-- Este script se puede volver a ejecutar sin problema si algo falla a
-- mitad (borra las políticas antes de recrearlas).

-- ---------- Partido en Vivo: guarda cronómetro, parte y minutos ----------
create table if not exists match_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  half int not null default 1,
  seconds int not null default 0,
  players jsonb not null default '[]',
  updated_at timestamptz not null default now()
);
alter table match_state enable row level security;
drop policy if exists "match_state_owner" on match_state;
create policy "match_state_owner" on match_state for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------- Perfiles: quién es admin ----------
-- Cada cuenta tiene una fila aquí (se crea sola al registrarse). El campo
-- is_admin decide quién ve el panel de administrador dentro de la app.
create table if not exists profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  username text not null,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);
alter table profiles enable row level security;

-- Función auxiliar: ¿el usuario actual es admin? (SECURITY DEFINER para
-- poder consultar la propia tabla profiles sin caer en un bucle de RLS).
create or replace function is_admin_user()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce((select is_admin from profiles where user_id = auth.uid()), false);
$$;

-- Cada usuario ve/edita solo su propio perfil; los admins ven todos
-- (necesario para que el panel de admin liste usuarios).
drop policy if exists "profiles_select_own_or_admin" on profiles;
create policy "profiles_select_own_or_admin" on profiles for select
  using (auth.uid() = user_id or is_admin_user());
drop policy if exists "profiles_insert_own" on profiles;
create policy "profiles_insert_own" on profiles for insert
  with check (auth.uid() = user_id);
drop policy if exists "profiles_update_own" on profiles;
create policy "profiles_update_own" on profiles for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Los admins pueden ver y borrar los datos de CUALQUIER usuario (no solo
-- crear/editar los suyos, eso ya lo cubre la política "_owner" de cada tabla).
drop policy if exists "players_admin_all" on players;
create policy "players_admin_all" on players for all
  using (is_admin_user());
drop policy if exists "pizarra_admin_all" on pizarra;
create policy "pizarra_admin_all" on pizarra for all
  using (is_admin_user());
drop policy if exists "exercises_admin_all" on exercises;
create policy "exercises_admin_all" on exercises for all
  using (is_admin_user());
drop policy if exists "scouting_rival_admin_all" on scouting_rival;
create policy "scouting_rival_admin_all" on scouting_rival for all
  using (is_admin_user());
drop policy if exists "scouting_targets_admin_all" on scouting_targets;
create policy "scouting_targets_admin_all" on scouting_targets for all
  using (is_admin_user());
drop policy if exists "match_state_admin_all" on match_state;
create policy "match_state_admin_all" on match_state for all
  using (is_admin_user());

-- Una vez ejecutado esto, marca tu propia cuenta como admin (sustituye el
-- nombre de usuario por el tuyo) y vuelve a iniciar sesión en la app:
-- update profiles set is_admin = true where username = 'tu_usuario';
