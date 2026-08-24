-- Oficina del Entrenador — migración 3 (ejecutar una sola vez en el SQL
-- Editor de Supabase, después de supabase_migration_02_admin_and_match.sql).
-- Añade: formato de equipo (Fútbol 7 / Fútbol 11), calendario de
-- entrenamientos con fechas reales + asistencia, e histórico de partidos
-- (marcador con autor de gol, tarjetas). Este script se puede volver a
-- ejecutar sin problema si algo falla a mitad.

-- ---------- Formato de equipo: Fútbol 7 (4 partes) o Fútbol 11 (2 partes) ----------
alter table profiles add column if not exists game_format text not null default 'F11';
alter table profiles drop constraint if exists profiles_game_format_check;
alter table profiles add constraint profiles_game_format_check check (game_format in ('F7', 'F11'));

-- ---------- Partido en curso: rival, fecha y eventos (goles/tarjetas) ----------
alter table match_state add column if not exists rival text not null default '';
alter table match_state add column if not exists match_date date not null default current_date;
alter table match_state add column if not exists events jsonb not null default '[]';

-- ---------- Histórico de partidos finalizados ----------
-- events: [{ type: 'goal'|'yellow'|'red', team: 'own'|'rival', playerId, playerName, minute, half }]
-- players: snapshot final de minutos por jugador, igual formato que match_state.players
create table if not exists matches (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  rival text,
  match_date date not null default current_date,
  format text not null default 'F11',
  periods int not null default 2,
  events jsonb not null default '[]',
  players jsonb not null default '[]',
  created_at timestamptz not null default now()
);
alter table matches enable row level security;
drop policy if exists "matches_owner" on matches;
create policy "matches_owner" on matches for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------- Calendario de entrenamientos: sesiones con fecha real ----------
create table if not exists training_sessions (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  session_date date not null,
  time text,
  label text not null,
  category text not null default 'Táctico',
  exercise_id bigint references exercises(id) on delete set null,
  created_at timestamptz not null default now()
);
alter table training_sessions enable row level security;
drop policy if exists "training_sessions_owner" on training_sessions;
create policy "training_sessions_owner" on training_sessions for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------- Asistencia a entrenamientos, por sesión y jugador ----------
create table if not exists training_attendance (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id bigint not null references training_sessions(id) on delete cascade,
  player_id bigint not null references players(id) on delete cascade,
  present boolean not null default true,
  unique (session_id, player_id)
);
alter table training_attendance enable row level security;
drop policy if exists "training_attendance_owner" on training_attendance;
create policy "training_attendance_owner" on training_attendance for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------- Los admins también pueden ver/borrar estas tablas nuevas ----------
drop policy if exists "matches_admin_all" on matches;
create policy "matches_admin_all" on matches for all
  using (is_admin_user());
drop policy if exists "training_sessions_admin_all" on training_sessions;
create policy "training_sessions_admin_all" on training_sessions for all
  using (is_admin_user());
drop policy if exists "training_attendance_admin_all" on training_attendance;
create policy "training_attendance_admin_all" on training_attendance for all
  using (is_admin_user());
