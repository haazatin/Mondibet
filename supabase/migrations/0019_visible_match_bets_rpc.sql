create or replace function public.get_visible_match_bets(p_tournament_id uuid)
returns table (
  match_id uuid,
  participant_id uuid,
  participant_name text,
  predicted_home_score_90 integer,
  predicted_away_score_90 integer,
  predicted_advancing_team_id uuid,
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
    bets.match_id,
    bets.participant_id,
    participants.display_name as participant_name,
    bets.predicted_home_score_90,
    bets.predicted_away_score_90,
    bets.predicted_advancing_team_id,
    bets.submitted_at
  from public.match_bets bets
  join public.participants participants
    on participants.id = bets.participant_id
  join public.matches matches
    on matches.id = bets.match_id
  left join public.results results
    on results.match_id = matches.id
  where matches.tournament_id = p_tournament_id
    and participants.tournament_id = p_tournament_id
    and participants.status = 'active'
    and (
      now() >= matches.daily_lock_at
      or results.id is not null
    )
  order by matches.starts_at, matches.sort_order, participants.display_name;
end;
$$;

grant execute on function public.get_visible_match_bets(uuid) to authenticated;
