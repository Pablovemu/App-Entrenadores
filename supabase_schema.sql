-- Oficina del Entrenador — esquema de base de datos (Supabase / Postgres)
-- Ejecutar una sola vez en el SQL Editor de Supabase.

create table if not exists players (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  number int not null,
  name text not null,
  position text not null,
  present boolean not null default true,
  created_at timestamptz not null default now()
);
alter table players enable row level security;
create policy "players_owner" on players for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists pizarra (
  user_id uuid primary key references auth.users(id) on delete cascade,
  positions jsonb,
  strokes jsonb,
  updated_at timestamptz not null default now()
);
alter table pizarra enable row level security;
create policy "pizarra_owner" on pizarra for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists exercises (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  category text not null,
  duration text,
  description text,
  created_at timestamptz not null default now()
);
alter table exercises enable row level security;
create policy "exercises_owner" on exercises for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists scouting_rival (
  user_id uuid primary key references auth.users(id) on delete cascade,
  name text,
  system text,
  notes text,
  updated_at timestamptz not null default now()
);
alter table scouting_rival enable row level security;
create policy "scouting_rival_owner" on scouting_rival for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists scouting_targets (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  position text,
  club text,
  note text,
  created_at timestamptz not null default now()
);
alter table scouting_targets enable row level security;
create policy "scouting_targets_owner" on scouting_targets for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
