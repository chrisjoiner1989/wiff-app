-- ─────────────────────────────────────────
-- Replace public-read SELECT policies with
-- commissioner-scoped SELECT policies so
-- each user only sees their own data.
-- ─────────────────────────────────────────

-- LEAGUES
drop policy if exists "leagues_public_read" on leagues;
create policy "leagues_owner_read" on leagues
  for select using (auth.uid() = commissioner_id);

-- TEAMS (readable if you own the parent league)
drop policy if exists "teams_public_read" on teams;
create policy "teams_owner_read" on teams
  for select using (
    exists (
      select 1 from leagues
      where leagues.id = teams.league_id
        and leagues.commissioner_id = auth.uid()
    )
  );

-- PLAYERS (readable if you own the league the team belongs to)
drop policy if exists "players_public_read" on players;
create policy "players_owner_read" on players
  for select using (
    exists (
      select 1 from teams
      join leagues on leagues.id = teams.league_id
      where teams.id = players.team_id
        and leagues.commissioner_id = auth.uid()
    )
  );

-- GAMES (readable if you own the league)
drop policy if exists "games_public_read" on games;
create policy "games_owner_read" on games
  for select using (
    exists (
      select 1 from leagues
      where leagues.id = games.league_id
        and leagues.commissioner_id = auth.uid()
    )
  );

-- GAME LINEUPS (readable if you own the game's league)
drop policy if exists "lineups_public_read" on game_lineups;
create policy "lineups_owner_read" on game_lineups
  for select using (
    exists (
      select 1 from games
      join leagues on leagues.id = games.league_id
      where games.id = game_lineups.game_id
        and leagues.commissioner_id = auth.uid()
    )
  );

-- AT BATS
drop policy if exists "at_bats_public_read" on at_bats;
create policy "at_bats_owner_read" on at_bats
  for select using (
    exists (
      select 1 from games
      join leagues on leagues.id = games.league_id
      where games.id = at_bats.game_id
        and leagues.commissioner_id = auth.uid()
    )
  );

-- PITCHES
drop policy if exists "pitches_public_read" on pitches;
create policy "pitches_owner_read" on pitches
  for select using (
    exists (
      select 1 from at_bats ab
      join games on games.id = ab.game_id
      join leagues on leagues.id = games.league_id
      where ab.id = pitches.at_bat_id
        and leagues.commissioner_id = auth.uid()
    )
  );

-- GAME INNINGS
drop policy if exists "innings_public_read" on game_innings;
create policy "innings_owner_read" on game_innings
  for select using (
    exists (
      select 1 from games
      join leagues on leagues.id = games.league_id
      where games.id = game_innings.game_id
        and leagues.commissioner_id = auth.uid()
    )
  );
