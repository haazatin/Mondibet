create policy "Admins can create tournament match bet overrides"
on public.match_bets
for insert
to authenticated
with check (
  is_admin_override = true
  and admin_override_reason is not null
  and exists (
    select 1
    from public.participants participant
    join public.matches match
      on match.tournament_id = participant.tournament_id
    join public.user_roles roles
      on roles.tournament_id = participant.tournament_id
    where participant.id = match_bets.participant_id
      and match.id = match_bets.match_id
      and roles.user_id = (select auth.uid())
      and roles.role = 'admin'
  )
);

create policy "Admins can update tournament match bet overrides"
on public.match_bets
for update
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
)
with check (
  is_admin_override = true
  and admin_override_reason is not null
  and exists (
    select 1
    from public.participants participant
    join public.matches match
      on match.tournament_id = participant.tournament_id
    join public.user_roles roles
      on roles.tournament_id = participant.tournament_id
    where participant.id = match_bets.participant_id
      and match.id = match_bets.match_id
      and roles.user_id = (select auth.uid())
      and roles.role = 'admin'
  )
);

create policy "Admins can read tournament audit logs"
on public.admin_audit_log
for select
to authenticated
using (
  exists (
    select 1
    from public.user_roles roles
    where roles.user_id = (select auth.uid())
      and roles.tournament_id = admin_audit_log.tournament_id
      and roles.role = 'admin'
  )
);

create policy "Admins can create tournament audit logs"
on public.admin_audit_log
for insert
to authenticated
with check (
  exists (
    select 1
    from public.user_roles roles
    where roles.user_id = (select auth.uid())
      and roles.tournament_id = admin_audit_log.tournament_id
      and roles.role = 'admin'
  )
);
