create or replace function public.get_bonus_lock_at(p_tournament_id uuid)
returns timestamptz
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  opening_at timestamptz;
begin
  select coalesce(
    tournaments.starts_at,
    (
      select min(matches.starts_at)
      from public.matches
      where matches.tournament_id = tournaments.id
    )
  )
  into opening_at
  from public.tournaments
  where tournaments.id = p_tournament_id;

  if opening_at is null then
    return null;
  end if;

  return (
    date(timezone('Asia/Jerusalem', opening_at))::timestamp + time '12:00'
  ) at time zone 'Asia/Jerusalem';
end;
$$;

grant execute on function public.get_bonus_lock_at(uuid) to authenticated;

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
  on conflict on constraint group_bonus_bets_participant_id_group_id_key
  do update set
    predicted_first_team_id = excluded.predicted_first_team_id,
    predicted_second_team_id = excluded.predicted_second_team_id,
    predicted_third_team_id = excluded.predicted_third_team_id,
    submitted_at = excluded.submitted_at,
    submitted_by_user_id = excluded.submitted_by_user_id,
    is_admin_override = false,
    admin_override_reason = null,
    updated_at = excluded.updated_at
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
  on conflict on constraint general_bonus_bets_participant_id_key
  do update set
    champion_team_id = excluded.champion_team_id,
    runner_up_team_id = excluded.runner_up_team_id,
    top_scorer_name = excluded.top_scorer_name,
    top_scorer_goals = excluded.top_scorer_goals,
    player_of_tournament = excluded.player_of_tournament,
    surprise_team_id = excluded.surprise_team_id,
    disappointment_team_id = excluded.disappointment_team_id,
    highest_scoring_group_id = excluded.highest_scoring_group_id,
    lowest_scoring_group_id = excluded.lowest_scoring_group_id,
    most_goals_team_id = excluded.most_goals_team_id,
    fewest_goals_team_id = excluded.fewest_goals_team_id,
    submitted_at = excluded.submitted_at,
    submitted_by_user_id = excluded.submitted_by_user_id,
    is_admin_override = false,
    admin_override_reason = null,
    updated_at = excluded.updated_at
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

create policy "Participants can read group assignments"
on public.group_teams
for select
to authenticated
using (
  exists (
    select 1
    from public.groups tournament_group
    join public.user_roles roles
      on roles.tournament_id = tournament_group.tournament_id
    where tournament_group.id = group_teams.group_id
      and roles.user_id = (select auth.uid())
      and roles.role = 'participant'
  )
);

create policy "Participants can read their own group bonus bets"
on public.group_bonus_bets
for select
to authenticated
using (
  exists (
    select 1
    from public.participants participant
    where participant.id = group_bonus_bets.participant_id
      and (
        participant.user_id = (select auth.uid())
        or lower(participant.email) = public.current_auth_email()
      )
  )
);

create policy "Participants can read their own general bonus bets"
on public.general_bonus_bets
for select
to authenticated
using (
  exists (
    select 1
    from public.participants participant
    where participant.id = general_bonus_bets.participant_id
      and (
        participant.user_id = (select auth.uid())
        or lower(participant.email) = public.current_auth_email()
      )
  )
);
