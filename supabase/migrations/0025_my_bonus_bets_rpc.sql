create or replace function public.get_my_group_bonus_bets(p_tournament_id uuid)
returns table (
  group_id uuid,
  predicted_first_team_id uuid,
  predicted_second_team_id uuid,
  predicted_third_team_id uuid,
  submitted_at timestamptz
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
    bets.group_id,
    bets.predicted_first_team_id,
    bets.predicted_second_team_id,
    bets.predicted_third_team_id,
    bets.submitted_at
  from public.group_bonus_bets bets
  join public.groups tournament_group
    on tournament_group.id = bets.group_id
  where tournament_group.tournament_id = p_tournament_id
    and bets.participant_id = participant_row.id
  order by tournament_group.sort_order;
end;
$$;

grant execute on function public.get_my_group_bonus_bets(uuid) to authenticated;

create or replace function public.get_my_general_bonus_bet(p_tournament_id uuid)
returns table (
  champion_team_id uuid,
  runner_up_team_id uuid,
  top_scorer_name text,
  top_scorer_goals integer,
  player_of_tournament text,
  surprise_team_id uuid,
  disappointment_team_id uuid,
  highest_scoring_group_id uuid,
  lowest_scoring_group_id uuid,
  most_goals_team_id uuid,
  fewest_goals_team_id uuid,
  submitted_at timestamptz
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
    bets.champion_team_id,
    bets.runner_up_team_id,
    bets.top_scorer_name,
    bets.top_scorer_goals,
    bets.player_of_tournament,
    bets.surprise_team_id,
    bets.disappointment_team_id,
    bets.highest_scoring_group_id,
    bets.lowest_scoring_group_id,
    bets.most_goals_team_id,
    bets.fewest_goals_team_id,
    bets.submitted_at
  from public.general_bonus_bets bets
  join public.participants participant
    on participant.id = bets.participant_id
  where participant.tournament_id = p_tournament_id
    and bets.participant_id = participant_row.id
  limit 1;
end;
$$;

grant execute on function public.get_my_general_bonus_bet(uuid) to authenticated;
