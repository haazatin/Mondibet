create policy "Admins can read tournament results"
on public.results
for select
to authenticated
using (
  exists (
    select 1
    from public.matches match
    join public.user_roles roles
      on roles.tournament_id = match.tournament_id
    where match.id = results.match_id
      and roles.user_id = (select auth.uid())
      and roles.role = 'admin'
  )
);

create policy "Admins can create tournament results"
on public.results
for insert
to authenticated
with check (
  exists (
    select 1
    from public.matches match
    join public.user_roles roles
      on roles.tournament_id = match.tournament_id
    where match.id = results.match_id
      and roles.user_id = (select auth.uid())
      and roles.role = 'admin'
  )
);

create policy "Admins can update tournament results"
on public.results
for update
to authenticated
using (
  exists (
    select 1
    from public.matches match
    join public.user_roles roles
      on roles.tournament_id = match.tournament_id
    where match.id = results.match_id
      and roles.user_id = (select auth.uid())
      and roles.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.matches match
    join public.user_roles roles
      on roles.tournament_id = match.tournament_id
    where match.id = results.match_id
      and roles.user_id = (select auth.uid())
      and roles.role = 'admin'
  )
);

create policy "Admins can read tournament match bets"
on public.match_bets
for select
to authenticated
using (
  exists (
    select 1
    from public.participants participant
    join public.user_roles roles
      on roles.tournament_id = participant.tournament_id
    where participant.id = match_bets.participant_id
      and roles.user_id = (select auth.uid())
      and roles.role = 'admin'
  )
);

create policy "Admins can read tournament score events"
on public.score_events
for select
to authenticated
using (
  exists (
    select 1
    from public.user_roles roles
    where roles.user_id = (select auth.uid())
      and roles.tournament_id = score_events.tournament_id
      and roles.role = 'admin'
  )
);

create policy "Admins can create tournament score events"
on public.score_events
for insert
to authenticated
with check (
  exists (
    select 1
    from public.user_roles roles
    where roles.user_id = (select auth.uid())
      and roles.tournament_id = score_events.tournament_id
      and roles.role = 'admin'
  )
);

create policy "Admins can delete tournament score events"
on public.score_events
for delete
to authenticated
using (
  exists (
    select 1
    from public.user_roles roles
    where roles.user_id = (select auth.uid())
      and roles.tournament_id = score_events.tournament_id
      and roles.role = 'admin'
  )
);
