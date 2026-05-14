create policy "Participants can read tournament teams"
on public.teams
for select
to authenticated
using (
  exists (
    select 1
    from public.user_roles roles
    where roles.user_id = (select auth.uid())
      and roles.tournament_id = teams.tournament_id
      and roles.role = 'participant'
  )
);

create policy "Participants can read tournament groups"
on public.groups
for select
to authenticated
using (
  exists (
    select 1
    from public.user_roles roles
    where roles.user_id = (select auth.uid())
      and roles.tournament_id = groups.tournament_id
      and roles.role = 'participant'
  )
);

create policy "Participants can read tournament matches"
on public.matches
for select
to authenticated
using (
  exists (
    select 1
    from public.user_roles roles
    where roles.user_id = (select auth.uid())
      and roles.tournament_id = matches.tournament_id
      and roles.role = 'participant'
  )
);

create policy "Participants can read their own match bets"
on public.match_bets
for select
to authenticated
using (
  exists (
    select 1
    from public.participants participant
    where participant.id = match_bets.participant_id
      and participant.user_id = (select auth.uid())
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
      and participant.user_id = (select auth.uid())
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
      and participant.user_id = (select auth.uid())
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
      and participant.user_id = (select auth.uid())
      and match.id = match_bets.match_id
      and now() < match.daily_lock_at
  )
);
