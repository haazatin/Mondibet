create or replace function public.get_my_completed_match_results(p_tournament_id uuid)
returns table (
  match_id uuid,
  sort_order integer,
  stage text,
  starts_at timestamptz,
  home_team_name text,
  away_team_name text,
  predicted_home_score_90 integer,
  predicted_away_score_90 integer,
  predicted_advancing_team_name text,
  actual_home_score_90 integer,
  actual_away_score_90 integer,
  actual_advancing_team_name text,
  points integer,
  reasons text
)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  current_user_id uuid := auth.uid();
  current_email text := '';
  participant_row record;
begin
  if current_user_id is null then
    return;
  end if;

  select lower(coalesce(users.email, ''))
  into current_email
  from auth.users users
  where users.id = current_user_id;

  if current_email = '' then
    current_email := lower(coalesce(auth.jwt() ->> 'email', ''));
  end if;

  if current_email = '' then
    return;
  end if;

  select p.id, p.tournament_id, p.email, p.user_id
  into participant_row
  from public.participants p
  where p.tournament_id = p_tournament_id
    and p.status = 'active'
    and (
      p.user_id = current_user_id
      or lower(p.email) = current_email
    )
  order by
    case when p.user_id = current_user_id then 0 else 1 end,
    p.created_at desc
  limit 1;

  if not found then
    return;
  end if;

  return query
  select
    matches.id as match_id,
    matches.sort_order,
    matches.stage,
    matches.starts_at,
    home_teams.name as home_team_name,
    away_teams.name as away_team_name,
    bets.predicted_home_score_90,
    bets.predicted_away_score_90,
    predicted_advancing_teams.name as predicted_advancing_team_name,
    results.home_score_90 as actual_home_score_90,
    results.away_score_90 as actual_away_score_90,
    actual_advancing_teams.name as actual_advancing_team_name,
    coalesce(sum(score_events.points), 0)::integer as points,
    coalesce(string_agg(score_events.reason, ', ' order by score_events.category), '') as reasons
  from public.matches matches
  join public.results results
    on results.match_id = matches.id
  left join public.match_bets bets
    on bets.match_id = matches.id
   and bets.participant_id = participant_row.id
  left join public.score_events score_events
    on score_events.tournament_id = p_tournament_id
   and score_events.participant_id = participant_row.id
   and score_events.source_type = 'match'
   and score_events.source_id = matches.id
  left join public.teams home_teams
    on home_teams.id = matches.home_team_id
  left join public.teams away_teams
    on away_teams.id = matches.away_team_id
  left join public.teams predicted_advancing_teams
    on predicted_advancing_teams.id = bets.predicted_advancing_team_id
  left join public.teams actual_advancing_teams
    on actual_advancing_teams.id = results.advancing_team_id
  where matches.tournament_id = p_tournament_id
  group by
    matches.id,
    matches.sort_order,
    matches.stage,
    matches.starts_at,
    home_teams.name,
    away_teams.name,
    bets.predicted_home_score_90,
    bets.predicted_away_score_90,
    predicted_advancing_teams.name,
    results.home_score_90,
    results.away_score_90,
    actual_advancing_teams.name
  order by matches.starts_at desc, matches.sort_order desc;
end;
$$;

grant execute on function public.get_my_completed_match_results(uuid) to authenticated;
