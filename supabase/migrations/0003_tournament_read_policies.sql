create policy "Tournament members can read their tournament"
on public.tournaments
for select
to authenticated
using (
  exists (
    select 1
    from public.user_roles roles
    where roles.user_id = (select auth.uid())
      and roles.tournament_id = tournaments.id
  )
);
