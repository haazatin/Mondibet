-- Seed the 2026 FIFA World Cup group stage from:
-- https://en.wikipedia.org/wiki/2026_FIFA_World_Cup
--
-- This keeps auth users, app participants, and user_roles.
-- It resets tournament setup/results/bets/scores for the FIFA World Cup 2026 tournament,
-- then inserts 48 teams, 12 groups, group assignments, and 72 group-stage matches.

begin;

create temporary table seed_teams (name text primary key) on commit drop;
insert into seed_teams (name) values
  ('Algeria'), ('Argentina'), ('Australia'), ('Austria'), ('Belgium'),
  ('Bosnia and Herzegovina'), ('Brazil'), ('Canada'), ('Cape Verde'), ('Colombia'),
  ('Croatia'), ('Curaçao'), ('Czech Republic'), ('DR Congo'), ('Ecuador'), ('Egypt'),
  ('England'), ('France'), ('Germany'), ('Ghana'), ('Haiti'), ('Iran'), ('Iraq'),
  ('Ivory Coast'), ('Japan'), ('Jordan'), ('Mexico'), ('Morocco'), ('Netherlands'),
  ('New Zealand'), ('Norway'), ('Panama'), ('Paraguay'), ('Portugal'), ('Qatar'),
  ('Saudi Arabia'), ('Scotland'), ('Senegal'), ('South Africa'), ('South Korea'),
  ('Spain'), ('Sweden'), ('Switzerland'), ('Tunisia'), ('Turkey'), ('United States'),
  ('Uruguay'), ('Uzbekistan');

create temporary table seed_groups (name text primary key, sort_order integer not null) on commit drop;
insert into seed_groups (name, sort_order) values
  ('Group A', 1), ('Group B', 2), ('Group C', 3), ('Group D', 4),
  ('Group E', 5), ('Group F', 6), ('Group G', 7), ('Group H', 8),
  ('Group I', 9), ('Group J', 10), ('Group K', 11), ('Group L', 12);

create temporary table seed_group_teams (
  group_name text not null,
  team_name text not null,
  seed_order integer not null
) on commit drop;
insert into seed_group_teams (group_name, team_name, seed_order) values
  ('Group A', 'Mexico', 1), ('Group A', 'South Africa', 2), ('Group A', 'South Korea', 3), ('Group A', 'Czech Republic', 4),
  ('Group B', 'Canada', 1), ('Group B', 'Bosnia and Herzegovina', 2), ('Group B', 'Qatar', 3), ('Group B', 'Switzerland', 4),
  ('Group C', 'Brazil', 1), ('Group C', 'Morocco', 2), ('Group C', 'Haiti', 3), ('Group C', 'Scotland', 4),
  ('Group D', 'United States', 1), ('Group D', 'Paraguay', 2), ('Group D', 'Australia', 3), ('Group D', 'Turkey', 4),
  ('Group E', 'Germany', 1), ('Group E', 'Curaçao', 2), ('Group E', 'Ivory Coast', 3), ('Group E', 'Ecuador', 4),
  ('Group F', 'Netherlands', 1), ('Group F', 'Japan', 2), ('Group F', 'Sweden', 3), ('Group F', 'Tunisia', 4),
  ('Group G', 'Belgium', 1), ('Group G', 'Egypt', 2), ('Group G', 'Iran', 3), ('Group G', 'New Zealand', 4),
  ('Group H', 'Spain', 1), ('Group H', 'Cape Verde', 2), ('Group H', 'Saudi Arabia', 3), ('Group H', 'Uruguay', 4),
  ('Group I', 'France', 1), ('Group I', 'Senegal', 2), ('Group I', 'Iraq', 3), ('Group I', 'Norway', 4),
  ('Group J', 'Argentina', 1), ('Group J', 'Algeria', 2), ('Group J', 'Austria', 3), ('Group J', 'Jordan', 4),
  ('Group K', 'Portugal', 1), ('Group K', 'DR Congo', 2), ('Group K', 'Uzbekistan', 3), ('Group K', 'Colombia', 4),
  ('Group L', 'England', 1), ('Group L', 'Croatia', 2), ('Group L', 'Ghana', 3), ('Group L', 'Panama', 4);

create temporary table seed_matches (
  sort_order integer primary key,
  group_name text not null,
  home_team_name text not null,
  away_team_name text not null,
  starts_at_text text not null
) on commit drop;
insert into seed_matches (sort_order, group_name, home_team_name, away_team_name, starts_at_text) values
  (1, 'Group A', 'Mexico', 'South Africa', '2026-06-11 1:00 PM -06:00'),
  (2, 'Group A', 'South Korea', 'Czech Republic', '2026-06-11 8:00 PM -06:00'),
  (3, 'Group B', 'Canada', 'Bosnia and Herzegovina', '2026-06-12 3:00 PM -04:00'),
  (4, 'Group D', 'United States', 'Paraguay', '2026-06-12 6:00 PM -07:00'),
  (5, 'Group C', 'Haiti', 'Scotland', '2026-06-13 9:00 PM -04:00'),
  (6, 'Group D', 'Australia', 'Turkey', '2026-06-13 9:00 PM -07:00'),
  (7, 'Group C', 'Brazil', 'Morocco', '2026-06-13 6:00 PM -04:00'),
  (8, 'Group B', 'Qatar', 'Switzerland', '2026-06-13 12:00 PM -07:00'),
  (9, 'Group E', 'Ivory Coast', 'Ecuador', '2026-06-14 7:00 PM -04:00'),
  (10, 'Group E', 'Germany', 'Curaçao', '2026-06-14 12:00 PM -05:00'),
  (11, 'Group F', 'Netherlands', 'Japan', '2026-06-14 3:00 PM -05:00'),
  (12, 'Group F', 'Sweden', 'Tunisia', '2026-06-14 8:00 PM -06:00'),
  (13, 'Group H', 'Saudi Arabia', 'Uruguay', '2026-06-15 6:00 PM -04:00'),
  (14, 'Group H', 'Spain', 'Cape Verde', '2026-06-15 12:00 PM -04:00'),
  (15, 'Group G', 'Iran', 'New Zealand', '2026-06-15 6:00 PM -07:00'),
  (16, 'Group G', 'Belgium', 'Egypt', '2026-06-15 12:00 PM -07:00'),
  (17, 'Group I', 'France', 'Senegal', '2026-06-16 3:00 PM -04:00'),
  (18, 'Group I', 'Iraq', 'Norway', '2026-06-16 6:00 PM -04:00'),
  (19, 'Group J', 'Argentina', 'Algeria', '2026-06-16 8:00 PM -05:00'),
  (20, 'Group J', 'Austria', 'Jordan', '2026-06-16 9:00 PM -07:00'),
  (21, 'Group L', 'Ghana', 'Panama', '2026-06-17 7:00 PM -04:00'),
  (22, 'Group L', 'England', 'Croatia', '2026-06-17 3:00 PM -05:00'),
  (23, 'Group K', 'Portugal', 'DR Congo', '2026-06-17 12:00 PM -05:00'),
  (24, 'Group K', 'Uzbekistan', 'Colombia', '2026-06-17 8:00 PM -06:00'),
  (25, 'Group A', 'Czech Republic', 'South Africa', '2026-06-18 12:00 PM -04:00'),
  (26, 'Group B', 'Switzerland', 'Bosnia and Herzegovina', '2026-06-18 12:00 PM -07:00'),
  (27, 'Group B', 'Canada', 'Qatar', '2026-06-18 3:00 PM -07:00'),
  (28, 'Group A', 'Mexico', 'South Korea', '2026-06-18 7:00 PM -06:00'),
  (29, 'Group C', 'Brazil', 'Haiti', '2026-06-19 8:30 PM -04:00'),
  (30, 'Group C', 'Scotland', 'Morocco', '2026-06-19 6:00 PM -04:00'),
  (31, 'Group D', 'Turkey', 'Paraguay', '2026-06-19 8:00 PM -07:00'),
  (32, 'Group D', 'United States', 'Australia', '2026-06-19 12:00 PM -07:00'),
  (33, 'Group E', 'Germany', 'Ivory Coast', '2026-06-20 4:00 PM -04:00'),
  (34, 'Group E', 'Ecuador', 'Curaçao', '2026-06-20 7:00 PM -05:00'),
  (35, 'Group F', 'Netherlands', 'Sweden', '2026-06-20 12:00 PM -05:00'),
  (36, 'Group F', 'Tunisia', 'Japan', '2026-06-20 10:00 PM -06:00'),
  (37, 'Group H', 'Uruguay', 'Cape Verde', '2026-06-21 6:00 PM -04:00'),
  (38, 'Group H', 'Spain', 'Saudi Arabia', '2026-06-21 12:00 PM -04:00'),
  (39, 'Group G', 'Belgium', 'Iran', '2026-06-21 12:00 PM -07:00'),
  (40, 'Group G', 'New Zealand', 'Egypt', '2026-06-21 6:00 PM -07:00'),
  (41, 'Group I', 'Norway', 'Senegal', '2026-06-22 8:00 PM -04:00'),
  (42, 'Group I', 'France', 'Iraq', '2026-06-22 5:00 PM -04:00'),
  (43, 'Group J', 'Argentina', 'Austria', '2026-06-22 12:00 PM -05:00'),
  (44, 'Group J', 'Jordan', 'Algeria', '2026-06-22 8:00 PM -07:00'),
  (45, 'Group L', 'England', 'Ghana', '2026-06-23 4:00 PM -04:00'),
  (46, 'Group L', 'Panama', 'Croatia', '2026-06-23 7:00 PM -04:00'),
  (47, 'Group K', 'Portugal', 'Uzbekistan', '2026-06-23 12:00 PM -05:00'),
  (48, 'Group K', 'Colombia', 'DR Congo', '2026-06-23 8:00 PM -06:00'),
  (49, 'Group C', 'Scotland', 'Brazil', '2026-06-24 6:00 PM -04:00'),
  (50, 'Group C', 'Morocco', 'Haiti', '2026-06-24 6:00 PM -04:00'),
  (51, 'Group B', 'Switzerland', 'Canada', '2026-06-24 12:00 PM -07:00'),
  (52, 'Group B', 'Bosnia and Herzegovina', 'Qatar', '2026-06-24 12:00 PM -07:00'),
  (53, 'Group A', 'Czech Republic', 'Mexico', '2026-06-24 7:00 PM -06:00'),
  (54, 'Group A', 'South Africa', 'South Korea', '2026-06-24 7:00 PM -06:00'),
  (55, 'Group E', 'Curaçao', 'Ivory Coast', '2026-06-25 4:00 PM -04:00'),
  (56, 'Group E', 'Ecuador', 'Germany', '2026-06-25 4:00 PM -04:00'),
  (57, 'Group F', 'Japan', 'Sweden', '2026-06-25 6:00 PM -05:00'),
  (58, 'Group F', 'Tunisia', 'Netherlands', '2026-06-25 6:00 PM -05:00'),
  (59, 'Group D', 'Turkey', 'United States', '2026-06-25 7:00 PM -07:00'),
  (60, 'Group D', 'Paraguay', 'Australia', '2026-06-25 7:00 PM -07:00'),
  (61, 'Group I', 'Norway', 'France', '2026-06-26 3:00 PM -04:00'),
  (62, 'Group I', 'Senegal', 'Iraq', '2026-06-26 3:00 PM -04:00'),
  (63, 'Group G', 'Egypt', 'Iran', '2026-06-26 8:00 PM -07:00'),
  (64, 'Group G', 'New Zealand', 'Belgium', '2026-06-26 8:00 PM -07:00'),
  (65, 'Group H', 'Cape Verde', 'Saudi Arabia', '2026-06-26 7:00 PM -05:00'),
  (66, 'Group H', 'Uruguay', 'Spain', '2026-06-26 6:00 PM -06:00'),
  (67, 'Group L', 'Panama', 'England', '2026-06-27 5:00 PM -04:00'),
  (68, 'Group L', 'Croatia', 'Ghana', '2026-06-27 5:00 PM -04:00'),
  (69, 'Group J', 'Algeria', 'Austria', '2026-06-27 9:00 PM -05:00'),
  (70, 'Group J', 'Jordan', 'Argentina', '2026-06-27 9:00 PM -05:00'),
  (71, 'Group K', 'Colombia', 'Portugal', '2026-06-27 7:30 PM -04:00'),
  (72, 'Group K', 'DR Congo', 'Uzbekistan', '2026-06-27 7:30 PM -04:00');

do $$
declare
  v_tournament_id uuid;
begin
  select id
  into v_tournament_id
  from public.tournaments
  where name = 'FIFA World Cup 2026'
  order by created_at desc
  limit 1;

  if v_tournament_id is null then
    insert into public.tournaments (name, season, starts_at, status)
    values ('FIFA World Cup 2026', '2026', '2026-06-11 1:00 PM -06:00'::timestamptz, 'draft')
    returning id into v_tournament_id;
  else
    update public.tournaments
    set season = '2026',
        starts_at = '2026-06-11 1:00 PM -06:00'::timestamptz,
        status = 'draft'
    where id = v_tournament_id;
  end if;

  delete from public.score_events where tournament_id = v_tournament_id;
  delete from public.leaderboard_snapshot_rows rows
  using public.leaderboard_snapshots snapshots
  where rows.snapshot_id = snapshots.id
    and snapshots.tournament_id = v_tournament_id;
  delete from public.leaderboard_snapshots where tournament_id = v_tournament_id;
  delete from public.admin_audit_log where tournament_id = v_tournament_id;
  delete from public.match_bets bets
  using public.matches matches
  where bets.match_id = matches.id
    and matches.tournament_id = v_tournament_id;
  delete from public.results results
  using public.matches matches
  where results.match_id = matches.id
    and matches.tournament_id = v_tournament_id;
  delete from public.matches where tournament_id = v_tournament_id;
  delete from public.group_bonus_bets bets
  using public.participants participants
  where bets.participant_id = participants.id
    and participants.tournament_id = v_tournament_id;
  delete from public.general_bonus_bets bets
  using public.participants participants
  where bets.participant_id = participants.id
    and participants.tournament_id = v_tournament_id;
  delete from public.best_third_place_bets bets
  using public.participants participants
  where bets.participant_id = participants.id
    and participants.tournament_id = v_tournament_id;
  delete from public.group_bonus_results results
  using public.groups groups
  where results.group_id = groups.id
    and groups.tournament_id = v_tournament_id;
  delete from public.general_bonus_results where tournament_id = v_tournament_id;
  delete from public.group_teams assignments
  using public.groups groups
  where assignments.group_id = groups.id
    and groups.tournament_id = v_tournament_id;
  delete from public.teams where tournament_id = v_tournament_id;
  delete from public.groups where tournament_id = v_tournament_id;

  insert into public.teams (tournament_id, name)
  select v_tournament_id, name
  from seed_teams
  order by name;

  insert into public.groups (tournament_id, name, sort_order)
  select v_tournament_id, name, sort_order
  from seed_groups
  order by sort_order;

  insert into public.group_teams (group_id, team_id, seed_order)
  select groups.id, teams.id, seed.seed_order
  from seed_group_teams seed
  join public.groups groups
    on groups.tournament_id = v_tournament_id
   and groups.name = seed.group_name
  join public.teams teams
    on teams.tournament_id = v_tournament_id
   and teams.name = seed.team_name
  order by groups.sort_order, seed.seed_order;

  insert into public.matches (
    tournament_id,
    stage,
    group_id,
    home_team_id,
    away_team_id,
    starts_at,
    daily_lock_at,
    status,
    sort_order
  )
  select
    v_tournament_id,
    'group',
    groups.id,
    home_teams.id,
    away_teams.id,
    seed.starts_at_text::timestamptz,
    seed.starts_at_text::timestamptz,
    'scheduled',
    seed.sort_order
  from seed_matches seed
  join public.groups groups
    on groups.tournament_id = v_tournament_id
   and groups.name = seed.group_name
  join public.teams home_teams
    on home_teams.tournament_id = v_tournament_id
   and home_teams.name = seed.home_team_name
  join public.teams away_teams
    on away_teams.tournament_id = v_tournament_id
   and away_teams.name = seed.away_team_name
  order by seed.sort_order;

  update public.matches matches
  set daily_lock_at = matches.starts_at - interval '7 hours'
  where matches.tournament_id = v_tournament_id;
end $$;

commit;
