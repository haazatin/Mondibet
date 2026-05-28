create or replace function public.submit_group_bonus_bet(
  p_group_id uuid,
  p_predicted_first_team_id uuid,
  p_predicted_second_team_id uuid,
  p_predicted_third_team_id uuid
)
returns table (
  bet_id uuid,
  saved_group_id uuid,
  saved_participant_id uuid
)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  current_user_id uuid := auth.uid();
  current_email text := '';
  participant_row record;
  group_row record;
  saved_bet record;
  lock_at timestamptz;
begin
  if current_user_id is null then
    raise exception 'You must be signed in to submit bonus bets.';
  end if;

  if p_predicted_first_team_id is null
     or p_predicted_second_team_id is null
     or p_predicted_third_team_id is null then
    raise exception 'Choose first, second, and third place teams.';
  end if;

  if p_predicted_first_team_id = p_predicted_second_team_id
     or p_predicted_first_team_id = p_predicted_third_team_id
     or p_predicted_second_team_id = p_predicted_third_team_id then
    raise exception 'Each group position must use a different team.';
  end if;

  select lower(coalesce(users.email, ''))
  into current_email
  from auth.users users
  where users.id = current_user_id;

  if current_email = '' then
    current_email := lower(coalesce(auth.jwt() ->> 'email', ''));
  end if;

  if current_email = '' then
    raise exception 'Signed-in user has no email.';
  end if;

  select p.id, p.tournament_id, p.email, p.user_id
  into participant_row
  from public.participants p
  where p.status = 'active'
    and (
      p.user_id = current_user_id
      or lower(p.email) = current_email
    )
  order by
    case when p.user_id = current_user_id then 0 else 1 end,
    p.created_at desc
  limit 1;

  if not found then
    raise exception 'You are not invited to submit bonus bets.';
  end if;

  if participant_row.user_id is distinct from current_user_id then
    update public.participants p
    set user_id = current_user_id
    where p.id = participant_row.id;
  end if;

  insert into public.user_roles (user_id, tournament_id, role)
  values (current_user_id, participant_row.tournament_id, 'participant')
  on conflict on constraint user_roles_user_id_tournament_id_role_key do nothing;

  select g.id, g.tournament_id
  into group_row
  from public.groups g
  where g.id = p_group_id
    and g.tournament_id = participant_row.tournament_id;

  if not found then
    raise exception 'Group was not found for this tournament.';
  end if;

  if exists (
    select 1
    from public.group_bonus_bets existing_bets
    where existing_bets.participant_id = participant_row.id
      and existing_bets.group_id = group_row.id
  ) then
    raise exception 'This bonus bet is already submitted. Ask the admin to override it if needed.';
  end if;

  lock_at := public.get_bonus_lock_at(group_row.tournament_id);

  if lock_at is null then
    raise exception 'Tournament opening date is not configured.';
  end if;

  if now() >= lock_at then
    raise exception 'Bonus betting is locked.';
  end if;

  if not exists (
    select 1
    from public.group_teams gt
    where gt.group_id = group_row.id
      and gt.team_id = p_predicted_first_team_id
  ) or not exists (
    select 1
    from public.group_teams gt
    where gt.group_id = group_row.id
      and gt.team_id = p_predicted_second_team_id
  ) or not exists (
    select 1
    from public.group_teams gt
    where gt.group_id = group_row.id
      and gt.team_id = p_predicted_third_team_id
  ) then
    raise exception 'Group predictions must use teams from the selected group.';
  end if;

  insert into public.group_bonus_bets (
    participant_id,
    group_id,
    predicted_first_team_id,
    predicted_second_team_id,
    predicted_third_team_id,
    submitted_at,
    submitted_by_user_id,
    is_admin_override,
    admin_override_reason,
    updated_at
  )
  values (
    participant_row.id,
    group_row.id,
    p_predicted_first_team_id,
    p_predicted_second_team_id,
    p_predicted_third_team_id,
    now(),
    current_user_id,
    false,
    null,
    now()
  )
  returning
    group_bonus_bets.id as id,
    group_bonus_bets.group_id as saved_group_id,
    group_bonus_bets.participant_id as saved_participant_id
  into saved_bet;

  return query
  select saved_bet.id, saved_bet.saved_group_id, saved_bet.saved_participant_id;
end;
$$;

grant execute on function public.submit_group_bonus_bet(uuid, uuid, uuid, uuid) to authenticated;

create or replace function public.submit_general_bonus_bet(
  p_champion_team_id uuid default null,
  p_runner_up_team_id uuid default null,
  p_top_scorer_name text default null,
  p_top_scorer_goals integer default null,
  p_player_of_tournament text default null,
  p_surprise_team_id uuid default null,
  p_disappointment_team_id uuid default null,
  p_highest_scoring_group_id uuid default null,
  p_lowest_scoring_group_id uuid default null,
  p_most_goals_team_id uuid default null,
  p_fewest_goals_team_id uuid default null
)
returns table (
  bet_id uuid,
  saved_participant_id uuid
)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  current_user_id uuid := auth.uid();
  current_email text := '';
  participant_row record;
  saved_bet record;
  lock_at timestamptz;
begin
  if current_user_id is null then
    raise exception 'You must be signed in to submit bonus bets.';
  end if;

  if p_top_scorer_goals is not null and p_top_scorer_goals < 0 then
    raise exception 'Top scorer goals must be a non-negative number.';
  end if;

  select lower(coalesce(users.email, ''))
  into current_email
  from auth.users users
  where users.id = current_user_id;

  if current_email = '' then
    current_email := lower(coalesce(auth.jwt() ->> 'email', ''));
  end if;

  if current_email = '' then
    raise exception 'Signed-in user has no email.';
  end if;

  select p.id, p.tournament_id, p.email, p.user_id
  into participant_row
  from public.participants p
  where p.status = 'active'
    and (
      p.user_id = current_user_id
      or lower(p.email) = current_email
    )
  order by
    case when p.user_id = current_user_id then 0 else 1 end,
    p.created_at desc
  limit 1;

  if not found then
    raise exception 'You are not invited to submit bonus bets.';
  end if;

  if participant_row.user_id is distinct from current_user_id then
    update public.participants p
    set user_id = current_user_id
    where p.id = participant_row.id;
  end if;

  insert into public.user_roles (user_id, tournament_id, role)
  values (current_user_id, participant_row.tournament_id, 'participant')
  on conflict on constraint user_roles_user_id_tournament_id_role_key do nothing;

  if exists (
    select 1
    from public.general_bonus_bets existing_bets
    where existing_bets.participant_id = participant_row.id
  ) then
    raise exception 'This bonus bet is already submitted. Ask the admin to override it if needed.';
  end if;

  lock_at := public.get_bonus_lock_at(participant_row.tournament_id);

  if lock_at is null then
    raise exception 'Tournament opening date is not configured.';
  end if;

  if now() >= lock_at then
    raise exception 'Bonus betting is locked.';
  end if;

  if exists (
    select 1
    from unnest(array[
      p_champion_team_id,
      p_runner_up_team_id,
      p_surprise_team_id,
      p_disappointment_team_id,
      p_most_goals_team_id,
      p_fewest_goals_team_id
    ]) as selected(team_id)
    where selected.team_id is not null
      and not exists (
        select 1
        from public.teams team
        where team.id = selected.team_id
          and team.tournament_id = participant_row.tournament_id
      )
  ) then
    raise exception 'Selected teams must belong to this tournament.';
  end if;

  if exists (
    select 1
    from unnest(array[p_highest_scoring_group_id, p_lowest_scoring_group_id]) as selected(group_id)
    where selected.group_id is not null
      and not exists (
        select 1
        from public.groups tournament_group
        where tournament_group.id = selected.group_id
          and tournament_group.tournament_id = participant_row.tournament_id
      )
  ) then
    raise exception 'Selected groups must belong to this tournament.';
  end if;

  insert into public.general_bonus_bets (
    participant_id,
    champion_team_id,
    runner_up_team_id,
    top_scorer_name,
    top_scorer_goals,
    player_of_tournament,
    surprise_team_id,
    disappointment_team_id,
    highest_scoring_group_id,
    lowest_scoring_group_id,
    most_goals_team_id,
    fewest_goals_team_id,
    submitted_at,
    submitted_by_user_id,
    is_admin_override,
    admin_override_reason,
    updated_at
  )
  values (
    participant_row.id,
    p_champion_team_id,
    p_runner_up_team_id,
    nullif(trim(coalesce(p_top_scorer_name, '')), ''),
    p_top_scorer_goals,
    nullif(trim(coalesce(p_player_of_tournament, '')), ''),
    p_surprise_team_id,
    p_disappointment_team_id,
    p_highest_scoring_group_id,
    p_lowest_scoring_group_id,
    p_most_goals_team_id,
    p_fewest_goals_team_id,
    now(),
    current_user_id,
    false,
    null,
    now()
  )
  returning
    general_bonus_bets.id as id,
    general_bonus_bets.participant_id as saved_participant_id
  into saved_bet;

  return query
  select saved_bet.id, saved_bet.saved_participant_id;
end;
$$;

grant execute on function public.submit_general_bonus_bet(
  uuid,
  uuid,
  text,
  integer,
  text,
  uuid,
  uuid,
  uuid,
  uuid,
  uuid,
  uuid
) to authenticated;

create or replace function public.get_my_completed_bonus_results(p_tournament_id uuid)
returns table (
  result_key text,
  sort_order integer,
  bet_name text,
  user_bet text,
  actual_result text,
  points integer,
  breakdown text
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
    ('group_bonus:' || group_results.id::text) as result_key,
    tournament_group.sort_order,
    tournament_group.name as bet_name,
    concat_ws(
      ', ',
      '1st ' || bet_first.name,
      '2nd ' || bet_second.name,
      '3rd ' || bet_third.name
    ) as user_bet,
    concat_ws(
      ', ',
      '1st ' || actual_first.name,
      '2nd ' || actual_second.name,
      '3rd ' || actual_third.name
    ) as actual_result,
    coalesce(sum(score_events.points), 0)::integer as points,
    coalesce(string_agg(score_events.reason, ', ' order by score_events.category), '') as breakdown
  from public.group_bonus_results group_results
  join public.groups tournament_group
    on tournament_group.id = group_results.group_id
  join public.group_bonus_bets bets
    on bets.group_id = tournament_group.id
   and bets.participant_id = participant_row.id
  left join public.teams bet_first
    on bet_first.id = bets.predicted_first_team_id
  left join public.teams bet_second
    on bet_second.id = bets.predicted_second_team_id
  left join public.teams bet_third
    on bet_third.id = bets.predicted_third_team_id
  left join public.teams actual_first
    on actual_first.id = group_results.first_team_id
  left join public.teams actual_second
    on actual_second.id = group_results.second_team_id
  left join public.teams actual_third
    on actual_third.id = group_results.third_team_id
  left join public.score_events score_events
    on score_events.tournament_id = p_tournament_id
   and score_events.participant_id = participant_row.id
   and score_events.source_type = 'group_bonus'
   and score_events.source_id = group_results.id
  where tournament_group.tournament_id = p_tournament_id
  group by
    group_results.id,
    tournament_group.sort_order,
    tournament_group.name,
    bet_first.name,
    bet_second.name,
    bet_third.name,
    actual_first.name,
    actual_second.name,
    actual_third.name

  union all

  select
    ('general_bonus:' || general_results.id::text) as result_key,
    1000 as sort_order,
    'General Bonus' as bet_name,
    concat_ws(
      ', ',
      'Champion ' || bet_champion.name,
      'Runner-up ' || bet_runner_up.name,
      'Top scorer ' || bets.top_scorer_name,
      'Top scorer goals ' || bets.top_scorer_goals::text,
      'Player ' || bets.player_of_tournament,
      'Highest group ' || bet_highest_group.name,
      'Lowest group ' || bet_lowest_group.name,
      'Most goals ' || bet_most_goals.name,
      'Fewest goals ' || bet_fewest_goals.name
    ) as user_bet,
    concat_ws(
      ', ',
      'Champion ' || actual_champion.name,
      'Runner-up ' || actual_runner_up.name,
      'Top scorer ' || general_results.top_scorer_name,
      'Top scorer goals ' || general_results.top_scorer_goals::text,
      'Player ' || general_results.player_of_tournament,
      'Highest group ' || actual_highest_group.name,
      'Lowest group ' || actual_lowest_group.name,
      'Most goals ' || actual_most_goals.name,
      'Fewest goals ' || actual_fewest_goals.name
    ) as actual_result,
    coalesce(sum(score_events.points), 0)::integer as points,
    coalesce(string_agg(score_events.reason, ', ' order by score_events.category), '') as breakdown
  from public.general_bonus_results general_results
  join public.general_bonus_bets bets
    on bets.participant_id = participant_row.id
  left join public.teams bet_champion
    on bet_champion.id = bets.champion_team_id
  left join public.teams bet_runner_up
    on bet_runner_up.id = bets.runner_up_team_id
  left join public.groups bet_highest_group
    on bet_highest_group.id = bets.highest_scoring_group_id
  left join public.groups bet_lowest_group
    on bet_lowest_group.id = bets.lowest_scoring_group_id
  left join public.teams bet_most_goals
    on bet_most_goals.id = bets.most_goals_team_id
  left join public.teams bet_fewest_goals
    on bet_fewest_goals.id = bets.fewest_goals_team_id
  left join public.teams actual_champion
    on actual_champion.id = general_results.champion_team_id
  left join public.teams actual_runner_up
    on actual_runner_up.id = general_results.runner_up_team_id
  left join public.groups actual_highest_group
    on actual_highest_group.id = general_results.highest_scoring_group_id
  left join public.groups actual_lowest_group
    on actual_lowest_group.id = general_results.lowest_scoring_group_id
  left join public.teams actual_most_goals
    on actual_most_goals.id = general_results.most_goals_team_id
  left join public.teams actual_fewest_goals
    on actual_fewest_goals.id = general_results.fewest_goals_team_id
  left join public.score_events score_events
    on score_events.tournament_id = p_tournament_id
   and score_events.participant_id = participant_row.id
   and score_events.source_type = 'general_bonus'
   and score_events.source_id = general_results.id
  where general_results.tournament_id = p_tournament_id
  group by
    general_results.id,
    bets.top_scorer_name,
    bets.top_scorer_goals,
    bets.player_of_tournament,
    general_results.top_scorer_name,
    general_results.top_scorer_goals,
    general_results.player_of_tournament,
    bet_champion.name,
    bet_runner_up.name,
    bet_highest_group.name,
    bet_lowest_group.name,
    bet_most_goals.name,
    bet_fewest_goals.name,
    actual_champion.name,
    actual_runner_up.name,
    actual_highest_group.name,
    actual_lowest_group.name,
    actual_most_goals.name,
    actual_fewest_goals.name
  order by 2, 3;
end;
$$;

grant execute on function public.get_my_completed_bonus_results(uuid) to authenticated;
