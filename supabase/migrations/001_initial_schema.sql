-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─────────────────────────────────────────
-- LEAGUES
-- ─────────────────────────────────────────
create table leagues (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  season text not null,
  commissioner_id uuid not null references auth.users(id) on delete cascade,
  rules_config jsonb not null default '{
    "innings": 9,
    "ghost_runners": true,
    "courtesy_runners_allowed": true,
    "strike_zone_type": "mat",
    "foul_ball_outs": true,
    "foul_balls_for_out": 3,
    "max_runs_per_inning": null,
    "mercy_rule_runs": 10,
    "mercy_rule_after_inning": 5,
    "pitching_distance_ft": 45,
    "no_leading_off": true,
    "no_stealing": true,
    "one_pitch_rule": false
  }',
  join_code text unique default upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 6)),
  created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────
-- TEAMS
-- ─────────────────────────────────────────
create table teams (
  id uuid primary key default uuid_generate_v4(),
  league_id uuid not null references leagues(id) on delete cascade,
  name text not null,
  logo_url text,
  color_hex text not null default '#1e3a5f',
  created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────
-- PLAYERS
-- ─────────────────────────────────────────
create table players (
  id uuid primary key default uuid_generate_v4(),
  team_id uuid not null references teams(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  name text not null,
  number text,
  position text,
  created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────
-- GAMES
-- ─────────────────────────────────────────
create type game_status as enum ('scheduled', 'live', 'final', 'postponed');

create table games (
  id uuid primary key default uuid_generate_v4(),
  league_id uuid not null references leagues(id) on delete cascade,
  home_team_id uuid not null references teams(id),
  away_team_id uuid not null references teams(id),
  scheduled_at timestamptz not null,
  status game_status not null default 'scheduled',
  field_location text,
  current_inning int not null default 1,
  current_half text not null default 'top' check (current_half in ('top', 'bottom')),
  outs int not null default 0 check (outs >= 0 and outs <= 3),
  home_score int not null default 0,
  away_score int not null default 0,
  -- Ghost runner state: base positions occupied (null = empty)
  runner_first uuid references players(id),
  runner_second uuid references players(id),
  runner_third uuid references players(id),
  created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────
-- GAME LINEUPS
-- ─────────────────────────────────────────
create table game_lineups (
  id uuid primary key default uuid_generate_v4(),
  game_id uuid not null references games(id) on delete cascade,
  team_id uuid not null references teams(id),
  player_id uuid not null references players(id),
  batting_order int not null check (batting_order >= 1 and batting_order <= 20),
  position text,
  is_pitcher boolean not null default false,
  created_at timestamptz not null default now(),
  unique (game_id, team_id, batting_order),
  unique (game_id, team_id, player_id)
);

-- ─────────────────────────────────────────
-- AT BATS
-- ─────────────────────────────────────────
create type at_bat_result as enum (
  'single', 'double', 'triple', 'hr',
  'out', 'walk', 'k', 'foul_out',
  'hbp', 'fc', 'error'
);

create table at_bats (
  id uuid primary key default uuid_generate_v4(),
  game_id uuid not null references games(id) on delete cascade,
  pitcher_id uuid not null references players(id),
  batter_id uuid not null references players(id),
  inning int not null,
  top_bottom text not null check (top_bottom in ('top', 'bottom')),
  result at_bat_result,
  rbi int not null default 0,
  sequence_in_game int not null,
  created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────
-- PITCHES
-- ─────────────────────────────────────────
create type pitch_result as enum ('ball', 'strike', 'foul', 'hit', 'hbp');
create type pitch_type as enum ('fastball', 'curveball', 'changeup', 'riser', 'drop', 'slider', 'knuckleball', 'other');

create table pitches (
  id uuid primary key default uuid_generate_v4(),
  at_bat_id uuid not null references at_bats(id) on delete cascade,
  pitch_type pitch_type,
  result pitch_result not null,
  sequence_number int not null,
  created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────
-- GAME INNINGS (linescore)
-- ─────────────────────────────────────────
create table game_innings (
  id uuid primary key default uuid_generate_v4(),
  game_id uuid not null references games(id) on delete cascade,
  inning int not null check (inning >= 1),
  home_runs int not null default 0,
  away_runs int not null default 0,
  home_hits int not null default 0,
  away_hits int not null default 0,
  home_errors int not null default 0,
  away_errors int not null default 0,
  created_at timestamptz not null default now(),
  unique (game_id, inning)
);

-- ─────────────────────────────────────────
-- INDEXES
-- ─────────────────────────────────────────
create index idx_teams_league_id on teams(league_id);
create index idx_players_team_id on players(team_id);
create index idx_players_user_id on players(user_id);
create index idx_games_league_id on games(league_id);
create index idx_games_status on games(status);
create index idx_at_bats_game_id on at_bats(game_id);
create index idx_at_bats_batter_id on at_bats(batter_id);
create index idx_at_bats_pitcher_id on at_bats(pitcher_id);
create index idx_pitches_at_bat_id on pitches(at_bat_id);
create index idx_game_lineups_game_id on game_lineups(game_id);
create index idx_game_innings_game_id on game_innings(game_id);
