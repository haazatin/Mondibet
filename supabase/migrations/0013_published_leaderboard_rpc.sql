create or replace function public.get_latest_published_leaderboard(p_tournament_id uuid)
returns table (
  snapshot_id uuid,
  published_at timestamptz,
  row_id uuid,
  rank integer,
  participant_name text,
  total_points integer,
  group_stage_points integer,
  knockout_points integer,
  bonus_points integer,
  streak_points integer
)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  current_user_id uuid := auth.uid();
  current_email text := '';
  latest_snapshot record;
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

  if not exists (
    select 1
    from public.user_roles roles
    where roles.user_id = current_user_id
      and roles.tournament_id = p_tournament_id
  )
  and not exists (
    select 1
    from public.participants participant
    where participant.tournament_id = p_tournament_id
      and lower(participant.email) = current_email
  ) then
    return;
  end if;

  select snapshots.id, snapshots.created_at
  into latest_snapshot
  from public.leaderboard_snapshots snapshots
  where snapshots.tournament_id = p_tournament_id
    and snapshots.is_published = true
  order by snapshots.created_at desc
  limit 1;

  if not found then
    return;
  end if;

  return query
  select
    latest_snapshot.id as snapshot_id,
    latest_snapshot.created_at as published_at,
    rows.id as row_id,
    rows.rank,
    participants.display_name as participant_name,
    rows.total_points,
    rows.group_stage_points,
    rows.knockout_points,
    rows.bonus_points,
    rows.streak_points
  from public.leaderboard_snapshot_rows rows
  join public.participants participants
    on participants.id = rows.participant_id
  where rows.snapshot_id = latest_snapshot.id
  order by rows.rank asc, participants.display_name asc;
end;
$$;

grant execute on function public.get_latest_published_leaderboard(uuid) to authenticated;
