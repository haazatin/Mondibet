create or replace function public.get_my_match_score_events(p_tournament_id uuid)
returns table (
  event_id uuid,
  source_id uuid,
  category text,
  points integer,
  reason text
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

  select p.id, p.tournament_id
  into participant_row
  from public.participants p
  where p.tournament_id = p_tournament_id
    and p.status = 'active'
    and (
      p.user_id = current_user_id
      or lower(p.email) = current_email
    )
  order by case when p.user_id = current_user_id then 0 else 1 end, p.created_at desc
  limit 1;

  if not found then
    return;
  end if;

  return query
  select
    score_events.id as event_id,
    score_events.source_id,
    score_events.category,
    score_events.points,
    score_events.reason
  from public.score_events
  where score_events.tournament_id = p_tournament_id
    and score_events.participant_id = participant_row.id
    and score_events.source_type = 'match'
  order by score_events.calculated_at desc;
end;
$$;

grant execute on function public.get_my_match_score_events(uuid) to authenticated;
