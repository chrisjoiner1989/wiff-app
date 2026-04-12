-- ─────────────────────────────────────────
-- Add missing UPDATE and DELETE RLS policies for pitches
-- Commissioners can correct or remove pitch entries they recorded
-- ─────────────────────────────────────────

create policy "pitches_commissioner_update" on pitches
  for update using (
    exists (
      select 1 from at_bats ab
      where ab.id = at_bat_id
      and is_league_commissioner(get_game_league_id(ab.game_id))
    )
  );

create policy "pitches_commissioner_delete" on pitches
  for delete using (
    exists (
      select 1 from at_bats ab
      where ab.id = at_bat_id
      and is_league_commissioner(get_game_league_id(ab.game_id))
    )
  );
