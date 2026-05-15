create policy "Admins can update tournament participants"
on public.participants
for update
to authenticated
using (
  exists (
    select 1
    from public.user_roles roles
    where roles.user_id = (select auth.uid())
      and roles.tournament_id = participants.tournament_id
      and roles.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.user_roles roles
    where roles.user_id = (select auth.uid())
      and roles.tournament_id = participants.tournament_id
      and roles.role = 'admin'
  )
);

create policy "Admins can delete draft tournament matches"
on public.matches
for delete
to authenticated
using (
  exists (
    select 1
    from public.user_roles roles
    where roles.user_id = (select auth.uid())
      and roles.tournament_id = matches.tournament_id
      and roles.role = 'admin'
  )
);
