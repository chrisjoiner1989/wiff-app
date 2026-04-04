-- ─────────────────────────────────────────
-- BATTING STATS VIEW
-- ─────────────────────────────────────────
create or replace view batting_stats as
select
  p.id as player_id,
  p.name as player_name,
  p.number as jersey_number,
  p.team_id,
  t.name as team_name,
  t.league_id,
  -- Games (distinct games appeared in)
  count(distinct ab.game_id) as g,
  -- At bats: exclude walks, hbp
  count(case when ab.result not in ('walk', 'hbp') then 1 end) as ab,
  -- Hits
  count(case when ab.result in ('single', 'double', 'triple', 'hr') then 1 end) as h,
  count(case when ab.result = 'single' then 1 end) as "1b",
  count(case when ab.result = 'double' then 1 end) as "2b",
  count(case when ab.result = 'triple' then 1 end) as "3b",
  count(case when ab.result = 'hr' then 1 end) as hr,
  coalesce(sum(ab.rbi), 0) as rbi,
  count(case when ab.result = 'walk' then 1 end) as bb,
  count(case when ab.result = 'k' then 1 end) as k,
  count(case when ab.result = 'hbp' then 1 end) as hbp,
  -- BA = H / AB
  case
    when count(case when ab.result not in ('walk', 'hbp') then 1 end) = 0 then 0.000
    else round(
      count(case when ab.result in ('single', 'double', 'triple', 'hr') then 1 end)::numeric /
      count(case when ab.result not in ('walk', 'hbp') then 1 end)::numeric,
      3
    )
  end as ba,
  -- OBP = (H + BB + HBP) / (AB + BB + HBP)
  case
    when (
      count(case when ab.result not in ('walk', 'hbp') then 1 end) +
      count(case when ab.result = 'walk' then 1 end) +
      count(case when ab.result = 'hbp' then 1 end)
    ) = 0 then 0.000
    else round(
      (
        count(case when ab.result in ('single', 'double', 'triple', 'hr') then 1 end) +
        count(case when ab.result = 'walk' then 1 end) +
        count(case when ab.result = 'hbp' then 1 end)
      )::numeric /
      (
        count(case when ab.result not in ('walk', 'hbp') then 1 end) +
        count(case when ab.result = 'walk' then 1 end) +
        count(case when ab.result = 'hbp' then 1 end)
      )::numeric,
      3
    )
  end as obp,
  -- SLG = Total Bases / AB
  case
    when count(case when ab.result not in ('walk', 'hbp') then 1 end) = 0 then 0.000
    else round(
      (
        count(case when ab.result = 'single' then 1 end) +
        count(case when ab.result = 'double' then 1 end) * 2 +
        count(case when ab.result = 'triple' then 1 end) * 3 +
        count(case when ab.result = 'hr' then 1 end) * 4
      )::numeric /
      count(case when ab.result not in ('walk', 'hbp') then 1 end)::numeric,
      3
    )
  end as slg
from players p
join teams t on t.id = p.team_id
left join at_bats ab on ab.batter_id = p.id
group by p.id, p.name, p.number, p.team_id, t.name, t.league_id;

-- ─────────────────────────────────────────
-- PITCHING STATS VIEW
-- ─────────────────────────────────────────
create or replace view pitching_stats as
select
  p.id as player_id,
  p.name as player_name,
  p.number as jersey_number,
  p.team_id,
  t.name as team_name,
  t.league_id,
  count(distinct ab.game_id) as g,
  -- IP: count outs / 3, formatted as X.Y (e.g. 6.2)
  count(case when ab.result in ('out', 'k', 'foul_out') then 1 end) as outs_recorded,
  floor(count(case when ab.result in ('out', 'k', 'foul_out') then 1 end) / 3.0) as ip_full,
  mod(count(case when ab.result in ('out', 'k', 'foul_out') then 1 end), 3) as ip_partial,
  count(case when ab.result in ('single', 'double', 'triple', 'hr') then 1 end) as h,
  coalesce(sum(ab.rbi), 0) as r,
  coalesce(sum(ab.rbi), 0) as er,
  count(case when ab.result = 'walk' then 1 end) as bb,
  count(case when ab.result = 'k' then 1 end) as k,
  -- ERA = (ER / IP) * 9
  case
    when count(case when ab.result in ('out', 'k', 'foul_out') then 1 end) = 0 then null
    else round(
      (coalesce(sum(ab.rbi), 0)::numeric /
      (count(case when ab.result in ('out', 'k', 'foul_out') then 1 end)::numeric / 3.0)) * 9.0,
      2
    )
  end as era,
  -- WHIP = (BB + H) / IP
  case
    when count(case when ab.result in ('out', 'k', 'foul_out') then 1 end) = 0 then null
    else round(
      (
        count(case when ab.result = 'walk' then 1 end) +
        count(case when ab.result in ('single', 'double', 'triple', 'hr') then 1 end)
      )::numeric /
      (count(case when ab.result in ('out', 'k', 'foul_out') then 1 end)::numeric / 3.0),
      2
    )
  end as whip,
  -- K/9
  case
    when count(case when ab.result in ('out', 'k', 'foul_out') then 1 end) = 0 then null
    else round(
      count(case when ab.result = 'k' then 1 end)::numeric /
      (count(case when ab.result in ('out', 'k', 'foul_out') then 1 end)::numeric / 3.0) * 9.0,
      1
    )
  end as k_per_9
from players p
join teams t on t.id = p.team_id
left join at_bats ab on ab.pitcher_id = p.id
group by p.id, p.name, p.number, p.team_id, t.name, t.league_id;

-- ─────────────────────────────────────────
-- STANDINGS VIEW
-- ─────────────────────────────────────────
create or replace view standings as
with team_records as (
  select
    t.id as team_id,
    t.name as team_name,
    t.league_id,
    t.color_hex,
    count(case when g.status = 'final' and (
      (g.home_team_id = t.id and g.home_score > g.away_score) or
      (g.away_team_id = t.id and g.away_score > g.home_score)
    ) then 1 end) as wins,
    count(case when g.status = 'final' and (
      (g.home_team_id = t.id and g.home_score < g.away_score) or
      (g.away_team_id = t.id and g.away_score < g.home_score)
    ) then 1 end) as losses,
    coalesce(sum(case when g.home_team_id = t.id then g.home_score
                      when g.away_team_id = t.id then g.away_score
                      else 0 end), 0) as runs_scored,
    coalesce(sum(case when g.home_team_id = t.id then g.away_score
                      when g.away_team_id = t.id then g.home_score
                      else 0 end), 0) as runs_allowed
  from teams t
  left join games g on (g.home_team_id = t.id or g.away_team_id = t.id)
  group by t.id, t.name, t.league_id, t.color_hex
)
select
  *,
  wins + losses as g,
  case when wins + losses = 0 then 0.000
    else round(wins::numeric / (wins + losses), 3)
  end as pct,
  runs_scored - runs_allowed as run_diff
from team_records
order by pct desc, run_diff desc;
