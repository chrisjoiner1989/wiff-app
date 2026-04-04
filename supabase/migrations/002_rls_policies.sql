-- ─────────────────────────────────────────
-- ENABLE ROW LEVEL SECURITY
-- ─────────────────────────────────────────
alter table leagues enable row level security;
alter table teams enable row level security;
alter table players enable row level security;
alter table games enable row level security;
alter table game_lineups enable row level security;
alter table at_bats enable row level security;
alter table pitches enable row level security;
alter table game_innings enable row level security;

-- ─────────────────────────────────────────
-- HELPER: is_league_commissioner
-- ─────────────────────────────────────────
create or replace function is_league_commissioner(league_id uuid)
returns boolean
language sql security definer stable as $$
  select exists (
    select 1 from leagues
    where id = league_id and commissioner_id = auth.uid()
  );
$$;

-- Helper: get league_id for a team
create or replace function get_team_league_id(team_id uuid)
returns uuid
language sql security definer stable as $$
  select league_id from teams where id = team_id;
$$;

-- Helper: get league_id for a game
create or replace function get_game_league_id(game_id uuid)
returns uuid
language sql security definer stable as $$
  select league_id from games where id = game_id;
$$;

-- ─────────────────────────────────────────
-- LEAGUES policies
-- ─────────────────────────────────────────
-- Anyone can read leagues
create policy "leagues_public_read" on leagues
  for select using (true);

-- Only authenticated users can create leagues
create policy "leagues_auth_insert" on leagues
  for insert with check (auth.uid() = commissioner_id);

-- Only commissioner can update/delete their league
create policy "leagues_commissioner_update" on leagues
  for update using (auth.uid() = commissioner_id);

create policy "leagues_commissioner_delete" on leagues
  for delete using (auth.uid() = commissioner_id);

-- ─────────────────────────────────────────
-- TEAMS policies
-- ─────────────────────────────────────────
create policy "teams_public_read" on teams
  for select using (true);

create policy "teams_commissioner_insert" on teams
  for insert with check (is_league_commissioner(league_id));

create policy "teams_commissioner_update" on teams
  for update using (is_league_commissioner(league_id));

create policy "teams_commissioner_delete" on teams
  for delete using (is_league_commissioner(league_id));

-- ─────────────────────────────────────────
-- PLAYERS policies
-- ─────────────────────────────────────────
create policy "players_public_read" on players
  for select using (true);

create policy "players_commissioner_insert" on players
  for insert with check (
    is_league_commissioner(get_team_league_id(team_id))
  );

create policy "players_commissioner_update" on players
  for update using (
    is_league_commissioner(get_team_league_id(team_id))
    or auth.uid() = user_id
  );

create policy "players_commissioner_delete" on players
  for delete using (
    is_league_commissioner(get_team_league_id(team_id))
  );

-- ─────────────────────────────────────────
-- GAMES policies
-- ─────────────────────────────────────────
create policy "games_public_read" on games
  for select using (true);

create policy "games_commissioner_insert" on games
  for insert with check (is_league_commissioner(league_id));

create policy "games_commissioner_update" on games
  for update using (is_league_commissioner(league_id));

create policy "games_commissioner_delete" on games
  for delete using (is_league_commissioner(league_id));

-- ─────────────────────────────────────────
-- GAME LINEUPS policies
-- ─────────────────────────────────────────
create policy "lineups_public_read" on game_lineups
  for select using (true);

create policy "lineups_commissioner_insert" on game_lineups
  for insert with check (
    is_league_commissioner(get_game_league_id(game_id))
  );

create policy "lineups_commissioner_update" on game_lineups
  for update using (
    is_league_commissioner(get_game_league_id(game_id))
  );

create policy "lineups_commissioner_delete" on game_lineups
  for delete using (
    is_league_commissioner(get_game_league_id(game_id))
  );

-- ─────────────────────────────────────────
-- AT BATS policies
-- ─────────────────────────────────────────
create policy "at_bats_public_read" on at_bats
  for select using (true);

create policy "at_bats_commissioner_insert" on at_bats
  for insert with check (
    is_league_commissioner(get_game_league_id(game_id))
  );

create policy "at_bats_commissioner_update" on at_bats
  for update using (
    is_league_commissioner(get_game_league_id(game_id))
  );

create policy "at_bats_commissioner_delete" on at_bats
  for delete using (
    is_league_commissioner(get_game_league_id(game_id))
  );

-- ─────────────────────────────────────────
-- PITCHES policies
-- ─────────────────────────────────────────
create policy "pitches_public_read" on pitches
  for select using (true);

create policy "pitches_commissioner_insert" on pitches
  for insert with check (
    exists (
      select 1 from at_bats ab
      where ab.id = at_bat_id
      and is_league_commissioner(get_game_league_id(ab.game_id))
    )
  );

-- ─────────────────────────────────────────
-- GAME INNINGS policies
-- ─────────────────────────────────────────
create policy "innings_public_read" on game_innings
  for select using (true);

create policy "innings_commissioner_insert" on game_innings
  for insert with check (
    is_league_commissioner(get_game_league_id(game_id))
  );

create policy "innings_commissioner_update" on game_innings
  for update using (
    is_league_commissioner(get_game_league_id(game_id))
  );
