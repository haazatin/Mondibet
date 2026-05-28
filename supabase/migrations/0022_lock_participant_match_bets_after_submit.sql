drop policy if exists "Participants can update their own unlocked match bets" on public.match_bets;

create or replace function public.submit_match_bet(
  p_match_id uuid,
  p_predicted_home_score_90 integer,
  p_predicted_away_score_90 integer,
  p_predicted_advancing_team_id uuid default null
)
returns table (
  bet_id uuid,
  saved_match_id uuid,
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
  match_row record;
  saved_bet record;
begin
  if current_user_id is null then
    raise exception 'You must be signed in to submit a bet.';
  end if;

  if p_predicted_home_score_90 is null
     or p_predicted_away_score_90 is null
     or p_predicted_home_score_90 < 0
     or p_predicted_away_score_90 < 0 then
    raise exception 'Scores must be non-negative numbers.';
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
    raise exception 'You are not invited to submit bets.';
  end if;

  if participant_row.user_id is distinct from current_user_id then
    update public.participants p
    set user_id = current_user_id
    where p.id = participant_row.id;
  end if;

  insert into public.user_roles (user_id, tournament_id, role)
  values (current_user_id, participant_row.tournament_id, 'participant')
  on conflict on constraint user_roles_user_id_tournament_id_role_key do nothing;

  select m.id, m.tournament_id, m.home_team_id, m.away_team_id, m.daily_lock_at
  into match_row
  from public.matches m
  where m.id = p_match_id
    and m.tournament_id = participant_row.tournament_id;

  if not found then
    raise exception 'Match was not found for this tournament.';
  end if;

  if exists (
    select 1
    from public.match_bets existing_bets
    where existing_bets.match_id = match_row.id
      and existing_bets.participant_id = participant_row.id
  ) then
    raise exception 'This bet is already submitted. Ask the admin to override it if needed.';
  end if;

  if now() >= match_row.daily_lock_at then
    raise exception 'Betting is locked for this match day.';
  end if;

  if p_predicted_advancing_team_id is not null
     and p_predicted_advancing_team_id <> match_row.home_team_id
     and p_predicted_advancing_team_id <> match_row.away_team_id then
    raise exception 'Advancing team must belong to this match.';
  end if;

  insert into public.match_bets (
    match_id,
    participant_id,
    predicted_home_score_90,
    predicted_away_score_90,
    predicted_advancing_team_id,
    submitted_at,
    submitted_by_user_id,
    is_admin_override,
    admin_override_reason,
    updated_at
  )
  values (
    match_row.id,
    participant_row.id,
    p_predicted_home_score_90,
    p_predicted_away_score_90,
    p_predicted_advancing_team_id,
    now(),
    current_user_id,
    false,
    null,
    now()
  )
  returning
    match_bets.id as id,
    match_bets.match_id as saved_match_id,
    match_bets.participant_id as saved_participant_id
  into saved_bet;

  return query
  select saved_bet.id, saved_bet.saved_match_id, saved_bet.saved_participant_id;
end;
$$;

grant execute on function public.submit_match_bet(uuid, integer, integer, uuid) to authenticated;
