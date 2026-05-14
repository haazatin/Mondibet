create or replace function public.current_auth_email()
returns text
language sql
security definer
set search_path = public, auth
stable
as $$
  select lower(coalesce(users.email, ''))
  from auth.users users
  where users.id = auth.uid()
$$;

grant execute on function public.current_auth_email() to authenticated;

drop policy if exists "Participants can read their own match bets" on public.match_bets;
drop policy if exists "Participants can create their own unlocked match bets" on public.match_bets;
drop policy if exists "Participants can update their own unlocked match bets" on public.match_bets;

create policy "Participants can read their own match bets"
on public.match_bets
for select
to authenticated
using (
  exists (
    select 1
    from public.participants participant
    where participant.id = match_bets.participant_id
      and (
        participant.user_id = (select auth.uid())
        or lower(participant.email) = public.current_auth_email()
      )
  )
);

create policy "Participants can create their own unlocked match bets"
on public.match_bets
for insert
to authenticated
with check (
  is_admin_override = false
  and submitted_by_user_id = (select auth.uid())
  and exists (
    select 1
    from public.participants participant
    join public.matches match
      on match.tournament_id = participant.tournament_id
    where participant.id = match_bets.participant_id
      and (
        participant.user_id = (select auth.uid())
        or lower(participant.email) = public.current_auth_email()
      )
      and match.id = match_bets.match_id
      and now() < match.daily_lock_at
  )
);

create policy "Participants can update their own unlocked match bets"
on public.match_bets
for update
to authenticated
using (
  is_admin_override = false
  and exists (
    select 1
    from public.participants participant
    join public.matches match
      on match.tournament_id = participant.tournament_id
    where participant.id = match_bets.participant_id
      and (
        participant.user_id = (select auth.uid())
        or lower(participant.email) = public.current_auth_email()
      )
      and match.id = match_bets.match_id
      and now() < match.daily_lock_at
  )
)
with check (
  is_admin_override = false
  and submitted_by_user_id = (select auth.uid())
  and exists (
    select 1
    from public.participants participant
    join public.matches match
      on match.tournament_id = participant.tournament_id
    where participant.id = match_bets.participant_id
      and (
        participant.user_id = (select auth.uid())
        or lower(participant.email) = public.current_auth_email()
      )
      and match.id = match_bets.match_id
      and now() < match.daily_lock_at
  )
);
